-- Ejecutar la función para asegurar que el primer usuario sea admin
SELECT public.ensure_first_user_is_admin();

-- Crear una función adicional para hacer admin a un usuario específico (solo para admins)
CREATE OR REPLACE FUNCTION public.make_user_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Solo los admins pueden ejecutar esta función
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Solo los administradores pueden cambiar roles de usuario';
  END IF;
  
  -- Actualizar el rol del usuario target a admin
  UPDATE public.user_roles 
  SET role = 'admin'::app_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Si el usuario no tiene un registro en user_roles, crearlo
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role, updated_at = now();
END;
$$;

-- Crear una función para cambiar rol de usuario (admin a user o viceversa)
CREATE OR REPLACE FUNCTION public.toggle_user_role(target_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_role app_role;
  new_role app_role;
BEGIN
  -- Solo los admins pueden ejecutar esta función
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Solo los administradores pueden cambiar roles de usuario';
  END IF;
  
  -- Obtener el rol actual del usuario
  SELECT role INTO current_role FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Determinar el nuevo rol
  IF current_role = 'admin'::app_role THEN
    new_role := 'user'::app_role;
  ELSE
    new_role := 'admin'::app_role;
  END IF;
  
  -- Actualizar el rol
  UPDATE public.user_roles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Si el usuario no tiene un registro en user_roles, crearlo
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) DO UPDATE SET role = new_role, updated_at = now();
  
  RETURN new_role;
END;
$$;