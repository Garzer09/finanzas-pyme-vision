-- Deduplicate existing client_configurations by (user_id, client_name)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, client_name
           ORDER BY updated_at DESC, created_at DESC, id DESC
         ) AS rn
  FROM public.client_configurations
)
DELETE FROM public.client_configurations c
USING ranked r
WHERE c.id = r.id AND r.rn > 1;

-- Create a unique index for (user_id, client_name) to support deterministic upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_config_user_client
ON public.client_configurations(user_id, client_name);

-- Attach a named constraint to the unique index (ignore if it already exists)
DO $$
BEGIN
  ALTER TABLE public.client_configurations
  ADD CONSTRAINT client_configurations_user_client_unique
  UNIQUE USING INDEX idx_client_config_user_client;
EXCEPTION WHEN duplicate_object THEN
  -- constraint already exists, ignore
  NULL;
END$$;
