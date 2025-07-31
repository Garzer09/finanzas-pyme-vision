-- Add missing columns to test_sessions table for real EDA processing
ALTER TABLE public.test_sessions 
ADD COLUMN IF NOT EXISTS eda_results jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS eda_status text DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS financial_analysis_results jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS financial_analysis_status text DEFAULT 'pending'::text;