-- Make the current user an admin (replace with actual user ID when running)
-- This ensures the current user has admin access to all features

-- First, let's update the user role for the current user
-- Since we can't directly reference auth.uid() in a migration,
-- we'll create a function to set the first user as admin

CREATE OR REPLACE FUNCTION public.ensure_first_user_is_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Execute the function to make the first user admin
SELECT public.ensure_first_user_is_admin();