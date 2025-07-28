-- Modificar la función handle_new_user para hacer que todos los usuarios sean admin por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.user_profiles (user_id, company_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'company_name');

  -- Assign admin role to all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$function$