-- Create client_configurations table to store per-user/client mapping preferences used by
-- intelligent-data-mapper and hooks like useDataProcessing/DataMappingWizard

-- 1) Table
CREATE TABLE IF NOT EXISTS public.client_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  industry_sector TEXT,
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_patterns JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Helpful constraint to allow deterministic upserts from app code
ALTER TABLE public.client_configurations
  ADD CONSTRAINT client_configurations_user_client_unique
  UNIQUE (user_id, client_name);

-- 3) RLS
ALTER TABLE public.client_configurations ENABLE ROW LEVEL SECURITY;

-- Users manage their own client configurations
CREATE POLICY "Users can select own client configurations"
ON public.client_configurations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client configurations"
ON public.client_configurations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client configurations"
ON public.client_configurations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own client configurations"
ON public.client_configurations
FOR DELETE
USING (auth.uid() = user_id);

-- Optional: allow admins to read all client configurations (useful for support)
CREATE POLICY "Admins can view all client configurations"
ON public.client_configurations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Updated-at trigger (function already exists in DB per project schema)
CREATE TRIGGER update_client_configurations_updated_at
BEFORE UPDATE ON public.client_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
