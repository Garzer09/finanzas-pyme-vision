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
    
    setIsCreating(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

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

      if (jobError) throw jobError;

      const jobId = jobData.id;

      // 2. Upload file to storage
      const filePath = `company/${companyId}/${jobId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('finance-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Clean up job record if upload fails
        await supabase.from('upload_jobs').delete().eq('id', jobId);
        throw uploadError;
      }

      // 3. Update job with file path
      const { error: updateError } = await supabase
        .from('upload_jobs')
        .update({ file_path: filePath })
        .eq('id', jobId);

      if (updateError) {
        // Clean up file and job if update fails
        await supabase.storage.from('finance-uploads').remove([filePath]);
        await supabase.from('upload_jobs').delete().eq('id', jobId);
        throw updateError;
      }

      // 4. Trigger processing via Edge Function
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        throw new Error('Token de autenticación no disponible');
      }

      const { data: processResult, error: processError } = await supabase.functions
        .invoke('process-upload', {
          body: { 
            job_id: jobId, 
            validate_only: validateOnly,
            error_cap: 5000
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

      if (processError) {
        console.error('Processing error:', processError);
        toast.error('Error al iniciar el procesamiento: ' + processError.message);
        // Note: Don't throw here as the job is created and will show the error
      }

      return jobId;

    } catch (error) {
      console.error('Error creating upload job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al crear trabajo de carga: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createJob,
    isCreating
  };
}