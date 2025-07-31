-- Enable pgcrypto extension for hash functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Multi-tenancy: memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'member',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, company_id)
);

-- Processing jobs tracking
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_path text NOT NULL,
    period daterange,
    status text NOT NULL DEFAULT 'PENDING',
    stats_json jsonb DEFAULT '{}'::jsonb,
    error_log_path text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Chart of accounts per company
CREATE TABLE IF NOT EXISTS public.accounts (
    company_id uuid NOT NULL,
    code text NOT NULL,
    name text,
    parent_code text,
    level int,
    pgc_group int,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (company_id, code)
);

-- Journal entries (headers)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id bigserial PRIMARY KEY,
    company_id uuid NOT NULL,
    entry_no bigint NOT NULL,
    tx_date date NOT NULL,
    memo text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (company_id, entry_no, tx_date)
);

-- Journal lines (detail with constraints)
CREATE TABLE IF NOT EXISTS public.journal_lines (
    id bigserial PRIMARY KEY,
    company_id uuid NOT NULL,
    entry_id bigint NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    line_no int NOT NULL,
    account text NOT NULL,
    description text,
    debit numeric(18,2) DEFAULT 0 CHECK (debit >= 0),
    credit numeric(18,2) DEFAULT 0 CHECK (credit >= 0),
    doc_ref text,
    line_hash text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (company_id, line_hash),
    UNIQUE (entry_id, line_no),
    CHECK ((debit = 0 AND credit > 0) OR (credit = 0 AND debit > 0))
);

-- Account mapping for financial statements
CREATE TABLE IF NOT EXISTS public.account_mapping (
    pgc_code text PRIMARY KEY,
    balance_sheet_section text,
    income_statement_section text,
    sign int DEFAULT 1,
    level int DEFAULT 1,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_jobs_company_status ON public.processing_jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date ON public.journal_entries(company_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_company_account ON public.journal_lines(company_id, account);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry_id ON public.journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_company ON public.memberships(user_id, company_id);

-- Enable RLS on all tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies based on memberships
CREATE POLICY "Users can manage own memberships" ON public.memberships
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Company members can access processing jobs" ON public.processing_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() AND company_id = processing_jobs.company_id
        )
    );

CREATE POLICY "Company members can access accounts" ON public.accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() AND company_id = accounts.company_id
        )
    );

CREATE POLICY "Company members can access journal entries" ON public.journal_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() AND company_id = journal_entries.company_id
        )
    );

CREATE POLICY "Company members can access journal lines" ON public.journal_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() AND company_id = journal_lines.company_id
        )
    );

-- Account mapping is read-only for all authenticated users
CREATE POLICY "All users can read account mapping" ON public.account_mapping
    FOR SELECT USING (auth.role() = 'authenticated');

-- Materialized view for trial balance (daily granularity)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.trial_balance_daily_mv AS
SELECT
    je.company_id,
    je.tx_date::date AS tx_date,
    jl.account,
    SUM(jl.debit) AS debit_sum,
    SUM(jl.credit) AS credit_sum,
    SUM(jl.debit - jl.credit) AS balance
FROM public.journal_lines jl
JOIN public.journal_entries je ON jl.entry_id = je.id
GROUP BY je.company_id, je.tx_date::date, jl.account;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_balance_daily_mv_unique 
    ON public.trial_balance_daily_mv(company_id, tx_date, account);

-- RPC function for batch journal line import (idempotent)
CREATE OR REPLACE FUNCTION public.import_journal_lines(
    _company uuid, 
    _period daterange, 
    _rows jsonb
)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    inserted_lines int := 0;
    errors_count int := 0;
    total_debit numeric := 0;
    total_credit numeric := 0;
BEGIN
    WITH r AS (
        SELECT * FROM jsonb_to_recordset(_rows) AS x(
            entry_no bigint, tx_date text, memo text, line_no int,
            account text, description text, debit text, credit text, doc_ref text
        )
    ), distinct_entries AS (
        SELECT DISTINCT entry_no, (tx_date)::date AS tx_date, memo FROM r
    ), upsert_entries AS (
        INSERT INTO public.journal_entries(company_id, entry_no, tx_date, memo)
        SELECT _company, entry_no, tx_date, memo FROM distinct_entries
        ON CONFLICT (company_id, entry_no, tx_date) DO UPDATE SET memo = excluded.memo
        RETURNING id, entry_no, tx_date
    )
    INSERT INTO public.journal_lines(company_id, entry_id, line_no, account, description, debit, credit, doc_ref, line_hash)
    SELECT
        _company,
        ue.id,
        r.line_no,
        r.account,
        r.description,
        (r.debit)::numeric,
        (r.credit)::numeric,
        r.doc_ref,
        encode(digest(concat_ws('|', r.entry_no, r.tx_date, r.line_no, r.account, 
                                coalesce(r.description,''), r.debit, r.credit, 
                                coalesce(r.doc_ref,'')), 'sha256'), 'hex')
    FROM r
    JOIN upsert_entries ue ON ue.entry_no = r.entry_no AND ue.tx_date = (r.tx_date)::date
    ON CONFLICT (company_id, line_hash) DO NOTHING;
    
    GET DIAGNOSTICS inserted_lines = ROW_COUNT;
    
    -- Calculate totals for validation
    SELECT 
        COALESCE(SUM((value->>'debit')::numeric), 0),
        COALESCE(SUM((value->>'credit')::numeric), 0)
    INTO total_debit, total_credit
    FROM jsonb_array_elements(_rows);
    
    RETURN jsonb_build_object(
        'inserted_lines', inserted_lines,
        'errors_count', errors_count,
        'total_debit', total_debit,
        'total_credit', total_credit,
        'status', 'success'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'inserted_lines', 0,
        'errors_count', 1,
        'error_message', SQLERRM,
        'status', 'error'
    );
END $$;

-- RPC function for refreshing materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views(_company uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh trial balance materialized view concurrently
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.trial_balance_daily_mv;
    
    RETURN jsonb_build_object(
        'status', 'success',
        'refreshed_at', now(),
        'views_refreshed', ARRAY['trial_balance_daily_mv']
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'error_message', SQLERRM
    );
END $$;

-- Storage buckets for file uploads and artifacts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gl-uploads', 'gl-uploads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('gl-artifacts', 'gl-artifacts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gl-uploads bucket
CREATE POLICY "Company members can upload to gl-uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'gl-uploads' AND
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() 
            AND company_id::text = (storage.foldername(name))[2]
        )
    );

CREATE POLICY "Company members can read from gl-uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'gl-uploads' AND
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() 
            AND company_id::text = (storage.foldername(name))[2]
        )
    );

-- Storage policies for gl-artifacts bucket
CREATE POLICY "Company members can access gl-artifacts" ON storage.objects
    FOR ALL USING (
        bucket_id = 'gl-artifacts' AND
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = auth.uid() 
            AND company_id::text = (storage.foldername(name))[2]
        )
    );

-- Trigger for updating processing_jobs.updated_at
CREATE OR REPLACE FUNCTION public.update_processing_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER processing_jobs_updated_at_trigger
    BEFORE UPDATE ON public.processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_processing_jobs_updated_at();