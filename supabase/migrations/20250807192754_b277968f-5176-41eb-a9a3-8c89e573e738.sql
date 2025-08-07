-- Retry migration without IF NOT EXISTS for policies
-- 1) Fix ambiguous RPC by dropping overloaded function
DROP FUNCTION IF EXISTS public.get_user_role(user_uuid uuid);

-- 2) Create memberships table for company-user access control
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own memberships; admins manage all
DO $$ BEGIN
  CREATE POLICY "Users can view own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage memberships"
  ON public.memberships FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Helper functions for access control
CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(has_role(_user_id, 'admin'::app_role), false)
         OR EXISTS (
           SELECT 1 FROM public.memberships m 
           WHERE m.user_id = _user_id AND m.company_id = _company_id
         );
$$;

CREATE OR REPLACE FUNCTION public.get_accessible_companies(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(company_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  -- Admins: all companies
  SELECT c.id AS company_id
  FROM public.companies c
  WHERE has_role(_user_id, 'admin'::app_role)
  UNION
  -- Members: only their companies
  SELECT m.company_id FROM public.memberships m WHERE m.user_id = _user_id;
$$;

-- 4) Add SELECT policies for company members on core financial tables
DO $$ BEGIN
  CREATE POLICY "Members can view fs_balance_lines"
  ON public.fs_balance_lines FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view fs_pyg_lines"
  ON public.fs_pyg_lines FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view operational_metrics"
  ON public.operational_metrics FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view financial_assumptions_normalized"
  ON public.financial_assumptions_normalized FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view financial_series_unified"
  ON public.financial_series_unified FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Members can view debt_balances"
  ON public.debt_balances FOR SELECT
  USING (public.has_company_access(auth.uid(), company_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
