-- Clear error records and test with new processing logic
-- First, delete the error records so we can retry processing
DELETE FROM financial_lines_staging WHERE status = 'error';

-- Now test processing one job manually to see if it works
DO $$
DECLARE
    test_job_id UUID;
    result JSONB;
BEGIN
    -- Get one pending job ID
    SELECT job_id INTO test_job_id 
    FROM financial_lines_staging 
    WHERE status = 'pending' 
    LIMIT 1;
    
    IF test_job_id IS NOT NULL THEN
        -- Process this job
        SELECT process_financial_staging(test_job_id) INTO result;
        
        -- Log the result
        RAISE NOTICE 'Test processing result for job %: %', test_job_id, result;
    ELSE
        RAISE NOTICE 'No pending jobs found to test';
    END IF;
END $$;