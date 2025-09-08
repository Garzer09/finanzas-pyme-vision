-- Process pending staging data manually
-- First, let's process all pending records using the process_financial_staging function

DO $$
DECLARE
    pending_job RECORD;
    result JSONB;
BEGIN
    -- Loop through all pending jobs and process them
    FOR pending_job IN 
        SELECT DISTINCT job_id 
        FROM financial_lines_staging 
        WHERE status = 'pending'
    LOOP
        -- Process this job
        SELECT process_financial_staging(pending_job.job_id) INTO result;
        
        -- Log the result
        RAISE NOTICE 'Processed job %: %', pending_job.job_id, result;
    END LOOP;
END $$;