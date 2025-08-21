-- Fix Security Definer View Issue
-- Drop the secured views and replace with proper RLS policies on materialized views

-- Drop the security definer views
DROP VIEW IF EXISTS public.fs_ratios_secured;
DROP VIEW IF EXISTS public.trial_balance_daily_secured;

-- Enable RLS on the materialized views 
ALTER TABLE public.fs_ratios_mv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_balance_daily_mv ENABLE ROW LEVEL SECURITY;

-- Add RLS policies to fs_ratios_mv
CREATE POLICY "Company members can view financial ratios"
  ON public.fs_ratios_mv
  FOR SELECT
  TO authenticated
  USING (has_company_access(auth.uid(), company_id));

-- Add RLS policies to trial_balance_daily_mv  
CREATE POLICY "Company members can view trial balance"
  ON public.trial_balance_daily_mv
  FOR SELECT
  TO authenticated
  USING (has_company_access(auth.uid(), company_id));