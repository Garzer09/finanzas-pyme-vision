-- Phase 1: Auxiliary tables and infrastructure

-- Upload jobs table
CREATE TABLE IF NOT EXISTS public.upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pyg','balance','cashflow')),
  file_sha256 TEXT,
  rows_total INTEGER,
  rows_ok INTEGER DEFAULT 0,
  rows_error INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','validating','inserting','transforming','refreshed','completed','failed')),
  error_message TEXT,
  validate_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, file_sha256)
);

-- Job logs table
CREATE TABLE IF NOT EXISTS public.upload_job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID REFERENCES public.upload_jobs(id) ON DELETE CASCADE,
  phase TEXT,
  level TEXT NOT NULL CHECK (level IN ('info','warn','error')),
  message TEXT NOT NULL,
  duration_ms INTEGER,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staging errors table
CREATE TABLE IF NOT EXISTS public.staging_errors (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID REFERENCES public.upload_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  column_name TEXT,
  error_code TEXT,
  error_detail TEXT,
  raw_record JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Balance section mapping table
CREATE TABLE IF NOT EXISTS public.balance_section_mapping (
  id BIGSERIAL PRIMARY KEY,
  input_variant TEXT NOT NULL UNIQUE,
  canonical_section TEXT NOT NULL CHECK (canonical_section IN ('Activo','Pasivo','Patrimonio Neto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default mappings
INSERT INTO public.balance_section_mapping (input_variant, canonical_section) VALUES
('activo', 'Activo'),
('ACTIVO', 'Activo'),
('Activo', 'Activo'),
('pasivo', 'Pasivo'),
('PASIVO', 'Pasivo'),
('Pasivo', 'Pasivo'),
('patrimonio neto', 'Patrimonio Neto'),
('PATRIMONIO NETO', 'Patrimonio Neto'),
('Patrimonio Neto', 'Patrimonio Neto'),
('patrimonio', 'Patrimonio Neto'),
('PATRIMONIO', 'Patrimonio Neto'),
('Patrimonio', 'Patrimonio Neto'),
('pn', 'Patrimonio Neto'),
('PN', 'Patrimonio Neto'),
('fondos propios', 'Patrimonio Neto'),
('FONDOS PROPIOS', 'Patrimonio Neto'),
('Fondos Propios', 'Patrimonio Neto')
ON CONFLICT (input_variant) DO NOTHING;

-- Add source_hash to financial_lines_staging if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_lines_staging' AND column_name = 'source_hash') THEN
    ALTER TABLE public.financial_lines_staging ADD COLUMN source_hash TEXT;
  END IF;
END $$;

-- Add source_hash to final tables if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fs_pyg_lines' AND column_name = 'source_hash') THEN
    ALTER TABLE public.fs_pyg_lines ADD COLUMN source_hash TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fs_balance_lines' AND column_name = 'source_hash') THEN
    ALTER TABLE public.fs_balance_lines ADD COLUMN source_hash TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fs_cashflow_lines' AND column_name = 'source_hash') THEN
    ALTER TABLE public.fs_cashflow_lines ADD COLUMN source_hash TEXT;
  END IF;
END $$;

-- Create unique indices for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_fs_pyg_lines_company_source_hash 
ON public.fs_pyg_lines(company_id, source_hash) WHERE source_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fs_balance_lines_company_source_hash 
ON public.fs_balance_lines(company_id, source_hash) WHERE source_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fs_cashflow_lines_company_source_hash 
ON public.fs_cashflow_lines(company_id, source_hash) WHERE source_hash IS NOT NULL;

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_upload_jobs_company_status ON public.upload_jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_upload_job_logs_job_created ON public.upload_job_logs(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_staging_errors_job_row ON public.staging_errors(job_id, row_number);

-- Function to normalize balance section
CREATE OR REPLACE FUNCTION public.normalize_balance_section(input_section TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (SELECT canonical_section FROM public.balance_section_mapping WHERE input_variant = LOWER(TRIM(input_section))),
    input_section
  );
$$;

-- Function to calculate source hash
CREATE OR REPLACE FUNCTION public.calculate_source_hash(
  p_job_id UUID,
  p_concepto TEXT,
  p_seccion TEXT DEFAULT NULL,
  p_periodo DATE,
  p_anio INTEGER,
  p_importe NUMERIC
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT encode(sha256(
    CONCAT(
      p_job_id::TEXT, '|',
      COALESCE(p_concepto, ''), '|',
      COALESCE(p_seccion, ''), '|',
      p_periodo::TEXT, '|',
      p_anio::TEXT, '|',
      p_importe::TEXT
    )::bytea
  ), 'hex');
$$;

-- Updated timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_upload_jobs_updated ON public.upload_jobs;
CREATE TRIGGER trg_upload_jobs_updated
  BEFORE UPDATE ON public.upload_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Main processing function with transaction and lock
CREATE OR REPLACE FUNCTION public.process_financial_staging(p_company_id UUID, p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lock_acquired BOOLEAN := FALSE;
  v_pyg_count INTEGER := 0;
  v_balance_count INTEGER := 0;
  v_cashflow_count INTEGER := 0;
  v_error_msg TEXT;
BEGIN
  -- Try to acquire company-level lock
  SELECT pg_try_advisory_xact_lock(hashtext(p_company_id::TEXT)) INTO v_lock_acquired;
  
  IF NOT v_lock_acquired THEN
    RAISE EXCEPTION 'COMPANY_LOCKED: Another upload is in progress for this company';
  END IF;

  -- Log start of transformation
  INSERT INTO public.upload_job_logs (job_id, phase, level, message, meta)
  VALUES (p_job_id, 'transforming', 'info', 'Starting transformation to final tables', 
          jsonb_build_object('company_id', p_company_id));

  -- Delete existing data with same source_hash (idempotency)
  DELETE FROM public.fs_pyg_lines 
  WHERE company_id = p_company_id 
    AND source_hash IN (
      SELECT source_hash FROM public.financial_lines_staging 
      WHERE company_id = p_company_id AND job_id = p_job_id AND data_type = 'estado_pyg'
    );

  DELETE FROM public.fs_balance_lines 
  WHERE company_id = p_company_id 
    AND source_hash IN (
      SELECT source_hash FROM public.financial_lines_staging 
      WHERE company_id = p_company_id AND job_id = p_job_id AND data_type = 'balance_situacion'
    );

  DELETE FROM public.fs_cashflow_lines 
  WHERE company_id = p_company_id 
    AND source_hash IN (
      SELECT source_hash FROM public.financial_lines_staging 
      WHERE company_id = p_company_id AND job_id = p_job_id AND data_type = 'estado_flujos'
    );

  -- Insert PYG data
  INSERT INTO public.fs_pyg_lines (
    company_id, concept, period_date, period_year, period_quarter, period_month,
    amount, currency_code, source_hash, job_id, uploaded_by, created_at, period_type
  )
  SELECT 
    s.company_id,
    s.concept_normalized,
    s.period_date,
    s.period_year,
    s.period_quarter,
    s.period_month,
    s.amount,
    COALESCE(s.currency_code, 'EUR'),
    s.source_hash,
    s.job_id,
    s.user_id,
    NOW(),
    s.period_type
  FROM public.financial_lines_staging s
  WHERE s.company_id = p_company_id 
    AND s.job_id = p_job_id 
    AND s.data_type = 'estado_pyg'
    AND s.source_hash IS NOT NULL;

  GET DIAGNOSTICS v_pyg_count = ROW_COUNT;

  -- Insert Balance data
  INSERT INTO public.fs_balance_lines (
    company_id, section, concept, period_date, period_year, period_quarter, period_month,
    amount, currency_code, source_hash, job_id, uploaded_by, created_at, period_type
  )
  SELECT 
    s.company_id,
    COALESCE(s.section, 'Total'),
    s.concept_normalized,
    s.period_date,
    s.period_year,
    s.period_quarter,
    s.period_month,
    s.amount,
    COALESCE(s.currency_code, 'EUR'),
    s.source_hash,
    s.job_id,
    s.user_id,
    NOW(),
    s.period_type
  FROM public.financial_lines_staging s
  WHERE s.company_id = p_company_id 
    AND s.job_id = p_job_id 
    AND s.data_type = 'balance_situacion'
    AND s.source_hash IS NOT NULL;

  GET DIAGNOSTICS v_balance_count = ROW_COUNT;

  -- Insert Cashflow data
  INSERT INTO public.fs_cashflow_lines (
    company_id, concept, period_date, period_year, period_quarter, period_month,
    amount, currency_code, source_hash, job_id, uploaded_by, created_at, period_type
  )
  SELECT 
    s.company_id,
    s.concept_normalized,
    s.period_date,
    s.period_year,
    s.period_quarter,
    s.period_month,
    s.amount,
    COALESCE(s.currency_code, 'EUR'),
    s.source_hash,
    s.job_id,
    s.user_id,
    NOW(),
    s.period_type
  FROM public.financial_lines_staging s
  WHERE s.company_id = p_company_id 
    AND s.job_id = p_job_id 
    AND s.data_type = 'estado_flujos'
    AND s.source_hash IS NOT NULL;

  GET DIAGNOSTICS v_cashflow_count = ROW_COUNT;

  -- Log completion
  INSERT INTO public.upload_job_logs (job_id, phase, level, message, meta)
  VALUES (p_job_id, 'transforming', 'info', 'Transformation completed successfully', 
          jsonb_build_object(
            'pyg_rows', v_pyg_count,
            'balance_rows', v_balance_count,
            'cashflow_rows', v_cashflow_count
          ));

  RETURN jsonb_build_object(
    'status', 'success',
    'rows_inserted', jsonb_build_object(
      'pyg', v_pyg_count,
      'balance', v_balance_count,
      'cashflow', v_cashflow_count
    )
  );

EXCEPTION WHEN OTHERS THEN
  v_error_msg := SQLERRM;
  
  -- Log error
  INSERT INTO public.upload_job_logs (job_id, phase, level, message, meta)
  VALUES (p_job_id, 'transforming', 'error', 'Transformation failed: ' || v_error_msg, 
          jsonb_build_object('error', v_error_msg));

  -- Update job status
  UPDATE public.upload_jobs 
  SET status = 'failed', error_message = v_error_msg, updated_at = NOW()
  WHERE id = p_job_id;

  RETURN jsonb_build_object(
    'status', 'error',
    'error', v_error_msg
  );
END;
$$;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_financial_materialized_views(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only refresh if materialized views exist
  -- This is a placeholder - add actual materialized view refreshes as needed
  
  RETURN jsonb_build_object(
    'status', 'success',
    'refreshed_at', NOW()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'error', SQLERRM
  );
END;
$$;

-- Enable RLS on all new tables
ALTER TABLE public.upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_section_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upload_jobs_rls ON public.upload_jobs
  FOR ALL USING (has_company_access(auth.uid(), company_id))
  WITH CHECK (has_company_access(auth.uid(), company_id));

CREATE POLICY upload_job_logs_rls ON public.upload_job_logs
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.upload_jobs j 
      WHERE j.id = job_id AND has_company_access(auth.uid(), j.company_id)
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.upload_jobs j 
      WHERE j.id = job_id AND has_company_access(auth.uid(), j.company_id)
    )
  );

CREATE POLICY staging_errors_rls ON public.staging_errors
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.upload_jobs j 
      WHERE j.id = job_id AND has_company_access(auth.uid(), j.company_id)
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.upload_jobs j 
      WHERE j.id = job_id AND has_company_access(auth.uid(), j.company_id)
    )
  );

CREATE POLICY balance_section_mapping_read ON public.balance_section_mapping
  FOR SELECT USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('finance-uploads', 'finance-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Company members can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'finance-uploads' AND
    auth.uid() IS NOT NULL AND
    -- Extract company_id from path: company/{company_id}/...
    SPLIT_PART(name, '/', 2)::uuid IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company members can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'finance-uploads' AND
    auth.uid() IS NOT NULL AND
    SPLIT_PART(name, '/', 2)::uuid IN (
      SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage all files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'finance-uploads' AND
    auth.role() = 'service_role'
  );

-- Enable Realtime for job tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.upload_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upload_job_logs;