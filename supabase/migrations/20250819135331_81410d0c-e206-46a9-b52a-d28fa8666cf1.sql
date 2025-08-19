-- Fix the last database function missing search_path

-- Fix function: is_first_user
CREATE OR REPLACE FUNCTION public.is_first_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles LIMIT 1
  );
$function$;