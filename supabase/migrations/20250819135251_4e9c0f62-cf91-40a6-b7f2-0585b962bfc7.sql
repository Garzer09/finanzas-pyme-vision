-- Fix remaining database function security issues

-- Fix function: refresh_materialized_views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views(_company uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Refresh trial balance materialized view concurrently
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.trial_balance_daily_mv;
    
    RETURN jsonb_build_object(
        'status', 'success',
        'refreshed_at', now(),
        'views_refreshed', ARRAY['trial_balance_daily_mv']
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'error_message', SQLERRM
    );
END $function$;

-- Fix function: refresh_ratios_mv  
CREATE OR REPLACE FUNCTION public.refresh_ratios_mv()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.fs_ratios_mv;
END;
$function$;