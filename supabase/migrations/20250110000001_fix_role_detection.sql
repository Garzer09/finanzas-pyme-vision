-- Fix role detection issue by properly mapping database enum values to frontend expectations
-- Database enum: ('admin', 'user') 
-- Frontend expects: ('admin', 'viewer')

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN role = 'admin' THEN 'admin'
    WHEN role = 'user' THEN 'viewer'
    ELSE 'viewer'
  END
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$function$;