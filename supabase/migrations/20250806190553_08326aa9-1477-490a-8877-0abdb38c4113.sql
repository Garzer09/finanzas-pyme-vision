-- Insert basic validation rules for template processing
INSERT INTO template_validation_rules (rule_name, rule_type, metric_code, record_type, validation_config, error_message, severity) VALUES
-- Financial Series validations
('require_metric_code', 'required', NULL, 'financial_series', '{"required": true}', 'Metric code is required for financial series data', 'error'),
('require_period', 'required', NULL, 'financial_series', '{"required": true}', 'Period is required for financial series data', 'error'),
('require_value', 'required', NULL, 'financial_series', '{"required": true}', 'Value is required for financial series data', 'error'),
('validate_frequency', 'enum', NULL, 'financial_series', '{"allowed_values": ["monthly", "quarterly", "annual"]}', 'Frequency must be monthly, quarterly, or annual', 'error'),
('validate_currency', 'pattern', NULL, 'financial_series', '{"pattern": "^[A-Z]{3}$"}', 'Currency must be a 3-letter code (e.g., EUR, USD)', 'warning'),

-- Company Profile validations  
('require_record_type', 'required', NULL, 'company_profile', '{"required": true}', 'Record type is required for company profile data', 'error'),
('require_field_name', 'required', NULL, 'company_profile', '{"required": true}', 'Field name is required for company profile data', 'error'),
('require_field_value', 'required', NULL, 'company_profile', '{"required": true}', 'Field value is required for company profile data', 'error'),
('validate_record_type', 'enum', NULL, 'company_profile', '{"allowed_values": ["basic_info", "financial_info", "operational_info", "market_info"]}', 'Record type must be one of: basic_info, financial_info, operational_info, market_info', 'error'),

-- Data type validations
('validate_numeric_value', 'range', NULL, 'financial_series', '{"min": -999999999, "max": 999999999}', 'Numeric value is out of acceptable range', 'warning'),
('validate_period_format', 'pattern', NULL, 'financial_series', '{"pattern": "^\\d{4}(-\\d{2})?(-\\d{2})?$"}', 'Period must be in format YYYY, YYYY-MM, or YYYY-MM-DD', 'error');

-- Insert basic metrics dictionary entries if they don't exist
INSERT INTO metrics_dictionary (metric_code, metric_name, category, value_kind, default_unit, description) VALUES
('REVENUE', 'Total Revenue', 'income_statement', 'flow', 'EUR', 'Total company revenue for the period'),
('EBITDA', 'EBITDA', 'income_statement', 'flow', 'EUR', 'Earnings before interest, taxes, depreciation and amortization'),
('NET_INCOME', 'Net Income', 'income_statement', 'flow', 'EUR', 'Net profit after all expenses and taxes'),
('ASSETS_TOT', 'Total Assets', 'balance_sheet', 'stock', 'EUR', 'Total company assets'),
('EQUITY', 'Total Equity', 'balance_sheet', 'stock', 'EUR', 'Total shareholder equity'),
('DEBT_TOT', 'Total Debt', 'balance_sheet', 'stock', 'EUR', 'Total company debt'),
('CASH', 'Cash and Equivalents', 'balance_sheet', 'stock', 'EUR', 'Cash and cash equivalents'),
('FCF', 'Free Cash Flow', 'cash_flow', 'flow', 'EUR', 'Free cash flow for the period')
ON CONFLICT (metric_code) DO NOTHING;