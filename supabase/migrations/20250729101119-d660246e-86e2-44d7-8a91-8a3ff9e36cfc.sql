-- FASE 1: Limpieza completa de la base de datos
-- Eliminar todos los usuarios de auth.users (esto se debe hacer manualmente desde el dashboard)
-- Limpiar todas las tablas relacionadas
DELETE FROM public.user_profiles;
DELETE FROM public.user_roles;
DELETE FROM public.financial_data;
DELETE FROM public.excel_files;
DELETE FROM public.detected_periods;
DELETE FROM public.data_quality_logs;
DELETE FROM public.financial_assumptions;
DELETE FROM public.user_kpis;
DELETE FROM public.data_mapping_rules;
DELETE FROM public.user_period_configurations;
DELETE FROM public.shareholder_search_history;
DELETE FROM public.client_configurations;
DELETE FROM public.company_shareholder_info;

-- FASE 2: Eliminar funciones complejas innecesarias
DROP FUNCTION IF EXISTS public.toggle_user_role(uuid);
DROP FUNCTION IF EXISTS public.make_user_admin(uuid);
DROP FUNCTION IF EXISTS public.ensure_first_user_is_admin();

-- FASE 3: Crear nueva función para detectar primer usuario
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles LIMIT 1
  );
$$;

-- FASE 4: Actualizar la función handle_new_user para implementar "primer usuario = admin"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Determinar el rol: si es el primer usuario, será admin; si no, será user
  IF is_first_user() THEN
    user_role := 'admin'::app_role;
  ELSE
    user_role := 'user'::app_role;
  END IF;

  -- Insertar en profiles
  INSERT INTO public.user_profiles (user_id, company_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'company_name');

  -- Insertar rol determinado
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- FASE 5: Crear función simple para que admins puedan promover usuarios
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Solo los admins pueden ejecutar esta función
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Solo los administradores pueden promover usuarios';
  END IF;
  
  -- Actualizar el rol del usuario target a admin
  UPDATE public.user_roles 
  SET role = 'admin'::app_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Si no existe el registro, no hacer nada (el usuario debe existir)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
END;
$$;