import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateJobParams {
  companyId: string;
  fileType: 'pyg' | 'balance' | 'cashflow';
  file: File;
  validateOnly?: boolean;
}

export function useUploadJob() {
  const [isCreating, setIsCreating] = useState(false);

  const createJob = async (params: CreateJobParams): Promise<string> => {
    const { companyId, fileType, file, validateOnly = false } = params;
    
    console.log('[UPLOAD-JOB] Starting job creation:', { companyId, fileType, fileName: file.name, validateOnly });
    setIsCreating(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('[UPLOAD-JOB] Auth error:', userError);
        throw new Error('Usuario no autenticado');
      }

      console.log('[UPLOAD-JOB] User authenticated:', user.id);

      // 1. Create upload job record
      const { data: jobData, error: jobError } = await supabase
        .from('upload_jobs')
        .insert({
          company_id: companyId,
          user_id: user.id,
          file_type: fileType,
          file_path: '', // Will be updated after file upload
          validate_only: validateOnly,
          status: 'queued'
        })
        .select()
        .single();

      if (jobError) {
        console.error('[UPLOAD-JOB] Job creation error:', jobError);
        throw jobError;
      }

      const jobId = jobData.id;
      console.log('[UPLOAD-JOB] Job created:', jobId);

      // 2. Upload file to storage
      const filePath = `company/${companyId}/${jobId}/${file.name}`;
      
      console.log('[UPLOAD-JOB] Uploading file to:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('finance-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[UPLOAD-JOB] Upload error:', uploadError);
        // Clean up job record if upload fails
        await supabase.from('upload_jobs').delete().eq('id', jobId);
        throw uploadError;
      }

      console.log('[UPLOAD-JOB] File uploaded successfully');

      // 3. Update job with file path
      const { error: updateError } = await supabase
        .from('upload_jobs')
        .update({ file_path: filePath })
        .eq('id', jobId);

      if (updateError) {
        console.error('[UPLOAD-JOB] Update error:', updateError);
        // Clean up file and job if update fails
        await supabase.storage.from('finance-uploads').remove([filePath]);
        await supabase.from('upload_jobs').delete().eq('id', jobId);
        throw updateError;
      }

      console.log('[UPLOAD-JOB] Job updated with file path');

      // 4. Trigger processing via Edge Function
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        console.error('[UPLOAD-JOB] No auth token available');
        throw new Error('Token de autenticación no disponible');
      }

      console.log('[UPLOAD-JOB] Invoking process-upload edge function');
      
      // Add timeout to prevent hanging
      const processPromise = supabase.functions.invoke('process-upload', {
        body: { 
          job_id: jobId, 
          validate_only: validateOnly,
          error_cap: 5000
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Set a 30-second timeout for the edge function call
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Edge function timeout')), 30000);
      });

      try {
        const result = await Promise.race([
          processPromise,
          timeoutPromise
        ]);
        
        const { data: processResult, error: processError } = result as any;

        if (processError) {
          console.error('[UPLOAD-JOB] Processing error:', processError);
          toast.error('Error al iniciar el procesamiento: ' + processError.message);
          // Note: Don't throw here as the job is created and will show the error
        } else {
          console.log('[UPLOAD-JOB] Processing started successfully');
        }
      } catch (timeoutError) {
        console.warn('[UPLOAD-JOB] Edge function call timed out, but job was created:', timeoutError);
        toast.warning('El procesamiento puede tardar más de lo esperado, pero se ha iniciado correctamente');
      }

      return jobId;

    } catch (error) {
      console.error('[UPLOAD-JOB] Error creating upload job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear trabajo de carga: ${errorMessage}`);
    } finally {
      console.log('[UPLOAD-JOB] Cleaning up, setting isCreating to false');
      setIsCreating(false);
    }
  };

  return {
    createJob,
    isCreating
  };
}