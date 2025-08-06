-- Add missing fields to financial_series_unified for 4-template architecture
ALTER TABLE financial_series_unified 
ADD COLUMN IF NOT EXISTS scenario text DEFAULT 'actual',
ADD COLUMN IF NOT EXISTS product_code text,
ADD COLUMN IF NOT EXISTS region_code text, 
ADD COLUMN IF NOT EXISTS customer_code text,
ADD COLUMN IF NOT EXISTS segment_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS as_of_date date DEFAULT CURRENT_DATE;

-- Add missing fields to company_profile_unified
ALTER TABLE company_profile_unified
ADD COLUMN IF NOT EXISTS extra_json jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS holder_type text,
ADD COLUMN IF NOT EXISTS direct_pct numeric,
ADD COLUMN IF NOT EXISTS indirect_pct numeric,
ADD COLUMN IF NOT EXISTS legal_name text,
ADD COLUMN IF NOT EXISTS year_founded integer,
ADD COLUMN IF NOT EXISTS employees_exact integer,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS hq_city text,
ADD COLUMN IF NOT EXISTS hq_country_code text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS holder_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_series_scenario ON financial_series_unified(scenario);
CREATE INDEX IF NOT EXISTS idx_financial_series_segments ON financial_series_unified(product_code, region_code, customer_code);
CREATE INDEX IF NOT EXISTS idx_company_profile_record_type ON company_profile_unified(record_type);

-- Create validation function for balance sheet integrity
CREATE OR REPLACE FUNCTION validate_balance_sheet_integrity(company_uuid uuid, period_text text, scenario_text text DEFAULT 'actual')
RETURNS jsonb
LANGUAGE plpgsql
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