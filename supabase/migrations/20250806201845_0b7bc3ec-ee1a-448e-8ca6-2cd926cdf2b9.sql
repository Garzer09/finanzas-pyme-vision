-- Simplificar la función handle_new_user para no requerir empresa ni otros datos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into user_profiles with minimal required data
  INSERT INTO public.user_profiles (user_id, subscription_status)
  VALUES (
    NEW.id, 
    'active'
  );
  
  -- Insert default role (always 'user' - admin promotion happens separately)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;