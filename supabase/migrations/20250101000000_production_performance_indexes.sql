-- Database Performance Optimization Migration
-- This migration adds critical indexes for production performance
-- Based on identified performance bottlenecks for large datasets

-- Index for financial_data queries by company and year (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_data_company_year 
ON public.financial_data(company_id, year);

-- Index for user_roles lookups (critical for authentication/authorization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- Index for client_configurations user queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_configurations_user_id 
ON public.client_configurations(user_id);

-- Additional performance indexes based on common query patterns

-- Index for financial_data by user_id (for user-specific data filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_data_user_id 
ON public.financial_data(user_id) WHERE user_id IS NOT NULL;

-- Index for financial_data by file_id (for file-specific queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_data_file_id 
ON public.financial_data(file_id) WHERE file_id IS NOT NULL;

-- Composite index for time-based financial data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financial_data_user_year_month 
ON public.financial_data(user_id, period_year, period_month) 
WHERE user_id IS NOT NULL AND period_year IS NOT NULL;

-- Index for data_quality_logs by user and file (for validation reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_quality_logs_user_file 
ON public.data_quality_logs(user_id, file_id);

-- Index for data_mapping_rules by user and activity status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_mapping_rules_user_active 
ON public.data_mapping_rules(user_id, is_active) WHERE is_active = true;

-- Performance improvements for excel_files table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_excel_files_user_status 
ON public.excel_files(user_id, processing_status) WHERE user_id IS NOT NULL;

-- Index for user_profiles by user_id (if not already exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id 
ON public.user_profiles(user_id);

-- Add table statistics update for query planner optimization
-- This helps PostgreSQL make better query execution plans
ANALYZE public.financial_data;
ANALYZE public.user_roles;
ANALYZE public.client_configurations;
ANALYZE public.data_quality_logs;
ANALYZE public.data_mapping_rules;
ANALYZE public.excel_files;
ANALYZE public.user_profiles;

-- Add comments for documentation
COMMENT ON INDEX idx_financial_data_company_year IS 'Performance index for financial data queries by company and year';
COMMENT ON INDEX idx_user_roles_user_id IS 'Critical index for user role lookups in authentication';
COMMENT ON INDEX idx_client_configurations_user_id IS 'Index for client configuration queries by user';
COMMENT ON INDEX idx_financial_data_user_year_month IS 'Composite index for time-based financial queries';