-- Create companies table for managing companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  accounting_standard TEXT DEFAULT 'PGC',
  sector TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  logo_url TEXT
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin can manage all companies
CREATE POLICY "Admin can manage companies" 
ON public.companies 
FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add new columns to processing_jobs for better tracking
ALTER TABLE public.processing_jobs 
ADD COLUMN IF NOT EXISTS period_type TEXT,
ADD COLUMN IF NOT EXISTS period_year INTEGER,
ADD COLUMN IF NOT EXISTS period_quarter INTEGER,
ADD COLUMN IF NOT EXISTS period_month INTEGER,
ADD COLUMN IF NOT EXISTS import_mode TEXT DEFAULT 'REPLACE',
ADD COLUMN IF NOT EXISTS dry_run BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS file_pack_hash TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_processing_jobs_company_period 
ON public.processing_jobs (company_id, period_type, period_year, period_quarter, period_month);

-- Update RLS policy for processing_jobs to be more specific
DROP POLICY IF EXISTS "jobs_admin_select" ON public.processing_jobs;
CREATE POLICY "Admin can view all processing jobs" 
ON public.processing_jobs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

-- Insert some sample companies for testing
INSERT INTO public.companies (name, currency_code, accounting_standard, sector, created_by) 
VALUES 
  ('Empresa Demo 1', 'EUR', 'PGC', 'Tecnología', (SELECT user_id FROM admins LIMIT 1)),
  ('Empresa Demo 2', 'USD', 'IFRS', 'Manufactura', (SELECT user_id FROM admins LIMIT 1)),
  ('Empresa Demo 3', 'EUR', 'PGC', 'Servicios', (SELECT user_id FROM admins LIMIT 1))
ON CONFLICT DO NOTHING;