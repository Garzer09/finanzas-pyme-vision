-- Fix security warning: Set proper search_path for the function
CREATE OR REPLACE FUNCTION public.ensure_first_user_is_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user from user_roles table
  SELECT user_id INTO first_user_id 
  FROM public.user_roles 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- If we found a user, make them admin
  IF first_user_id IS NOT NULL THEN
    UPDATE public.user_roles 
    SET role = 'admin'::app_role
    WHERE user_id = first_user_id;
  END IF;
END;
$$;