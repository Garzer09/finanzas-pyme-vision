-- Fix Database Function Security Issues
-- Add search_path parameter to functions missing it to prevent search path manipulation attacks

-- Fix function: update_test_sessions_updated_at
CREATE OR REPLACE FUNCTION public.update_test_sessions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_updated_at_column  
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix function: update_processing_jobs_updated_at
CREATE OR REPLACE FUNCTION public.update_processing_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix function: log_processing_step
CREATE OR REPLACE FUNCTION public.log_processing_step(_session_id uuid, _company_id uuid, _user_id uuid, _step_name text, _step_status text, _step_data jsonb DEFAULT '{}'::jsonb, _error_details jsonb DEFAULT '{}'::jsonb, _performance_metrics jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.processing_logs (
    session_id, company_id, user_id, step_name, step_status,
    step_data, error_details, performance_metrics
  ) VALUES (
    _session_id, _company_id, _user_id, _step_name, _step_status,
    _step_data, _error_details, _performance_metrics
  );
END;
$function$;

-- Fix function: validate_balance_sheet_integrity
CREATE OR REPLACE FUNCTION public.validate_balance_sheet_integrity(company_uuid uuid, period_text text, scenario_text text DEFAULT 'actual'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    assets_total numeric := 0;
    liabilities_equity_total numeric := 0;
    validation_result jsonb;
BEGIN
    -- Get total assets
    SELECT COALESCE(SUM(value), 0) INTO assets_total
    FROM financial_series_unified 
    WHERE company_id = company_uuid 
    AND period = period_text 
    AND scenario = scenario_text
    AND metric_code IN ('ASSETS_TOT', 'ASSETS_CURR', 'ASSETS_NC');
    
    -- Get total liabilities + equity  
    SELECT COALESCE(SUM(value), 0) INTO liabilities_equity_total
    FROM financial_series_unified
    WHERE company_id = company_uuid
    AND period = period_text 
    AND scenario = scenario_text
    AND metric_code IN ('EQUITY', 'DEBT_LT', 'DEBT_ST', 'AP');
    
    -- Calculate difference and tolerance
    validation_result := jsonb_build_object(
        'assets_total', assets_total,
        'liabilities_equity_total', liabilities_equity_total,
        'difference', assets_total - liabilities_equity_total,
        'tolerance_ok', ABS(assets_total - liabilities_equity_total) < 0.01,
        'company_id', company_uuid,
        'period', period_text,
        'scenario', scenario_text
    );
    
    RETURN validation_result;
END;
$function$;

-- Fix function: import_journal_lines
CREATE OR REPLACE FUNCTION public.import_journal_lines(_company uuid, _period daterange, _rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_lines int := 0;
    errors_count int := 0;
    total_debit numeric := 0;
    total_credit numeric := 0;
BEGIN
    WITH r AS (
        SELECT * FROM jsonb_to_recordset(_rows) AS x(
            entry_no bigint, tx_date text, memo text, line_no int,
            account text, description text, debit text, credit text, doc_ref text
        )
    ), distinct_entries AS (
        SELECT DISTINCT entry_no, (tx_date)::date AS tx_date, memo FROM r
    ), upsert_entries AS (
        INSERT INTO public.journal_entries(company_id, entry_no, tx_date, memo)
        SELECT _company, entry_no, tx_date, memo FROM distinct_entries
        ON CONFLICT (company_id, entry_no, tx_date) DO UPDATE SET memo = excluded.memo
        RETURNING id, entry_no, tx_date
    )
    INSERT INTO public.journal_lines(company_id, entry_id, line_no, account, description, debit, credit, doc_ref, line_hash)
    SELECT
        _company,
        ue.id,
        r.line_no,
        r.account,
        r.description,
        (r.debit)::numeric,
        (r.credit)::numeric,
        r.doc_ref,
        encode(digest(concat_ws('|', r.entry_no, r.tx_date, r.line_no, r.account, 
                                coalesce(r.description,''), r.debit, r.credit, 
                                coalesce(r.doc_ref,'')), 'sha256'), 'hex')
    FROM r
    JOIN upsert_entries ue ON ue.entry_no = r.entry_no AND ue.tx_date = (r.tx_date)::date
    ON CONFLICT (company_id, line_hash) DO NOTHING;
    
    GET DIAGNOSTICS inserted_lines = ROW_COUNT;
    
    -- Calculate totals for validation
    SELECT 
        COALESCE(SUM((value->>'debit')::numeric), 0),
        COALESCE(SUM((value->>'credit')::numeric), 0)
    INTO total_debit, total_credit
    FROM jsonb_array_elements(_rows);
    
    RETURN jsonb_build_object(
        'inserted_lines', inserted_lines,
        'errors_count', errors_count,
        'total_debit', total_debit,
        'total_credit', total_credit,
        'status', 'success'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'inserted_lines', 0,
        'errors_count', 1,
        'error_message', SQLERRM,
        'status', 'error'
    );
END 
$function$;