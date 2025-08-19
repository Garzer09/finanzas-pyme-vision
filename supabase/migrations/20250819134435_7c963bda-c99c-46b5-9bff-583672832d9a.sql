-- Fix Security Definer View Issue
-- Simply drop the problematic secured views since they bypass RLS
-- The application should query the base materialized views directly with proper filtering

DROP VIEW IF EXISTS public.fs_ratios_secured;
DROP VIEW IF EXISTS public.trial_balance_daily_secured;