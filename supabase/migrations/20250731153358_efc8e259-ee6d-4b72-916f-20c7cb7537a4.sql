-- Crear tabla admins
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies para admins (solo pueden ver su propio registro)
CREATE POLICY IF NOT EXISTS "admins_self_select"
ON public.admins FOR SELECT
USING (auth.uid() = user_id);

-- Eliminar policies existentes de processing_jobs
DROP POLICY IF EXISTS "Company members can access processing jobs" ON public.processing_jobs;

-- Nuevas policies para processing_jobs (solo admins)
CREATE POLICY IF NOT EXISTS "jobs_admin_select"
ON public.processing_jobs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "jobs_admin_insert"
ON public.processing_jobs FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "jobs_admin_update"
ON public.processing_jobs FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "jobs_admin_delete"
ON public.processing_jobs FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

-- Hacer buckets privados
UPDATE storage.buckets SET public = false WHERE id IN ('gl-uploads', 'gl-artifacts');

-- Insertar admin actual (basado en el contexto proporcionado)
INSERT INTO public.admins(user_id) VALUES ('40edeb28-584b-49ed-b767-cc2a96fb4f97') ON CONFLICT DO NOTHING;