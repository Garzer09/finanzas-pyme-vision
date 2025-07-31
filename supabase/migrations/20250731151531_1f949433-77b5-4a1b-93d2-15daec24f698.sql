-- Fix security warnings: add search_path to functions

-- Update import_journal_lines function with secure search_path
CREATE OR REPLACE FUNCTION public.import_journal_lines(
    _company uuid, 
    _period daterange, 
    _rows jsonb
)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
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

-- Update refresh_materialized_views function with secure search_path
CREATE OR REPLACE FUNCTION public.refresh_materialized_views(_company uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update other functions with secure search_path
CREATE OR REPLACE FUNCTION public.update_processing_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;