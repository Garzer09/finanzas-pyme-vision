-- Remove foreign key constraint from excel_files table to allow anonymous uploads
ALTER TABLE public.excel_files DROP CONSTRAINT IF EXISTS excel_files_user_id_fkey;

-- Also remove foreign key constraint from financial_data table  
ALTER TABLE public.financial_data DROP CONSTRAINT IF EXISTS financial_data_user_id_fkey;