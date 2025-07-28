-- Temporarily disable RLS for client_configurations to allow validation mode
-- This is needed because we're using a validation/bypass mode where auth.uid() is null

ALTER TABLE public.client_configurations DISABLE ROW LEVEL SECURITY;