import { useState, useCallback, useRef } from 'react';
import { validateFile, fileToBase64, FileValidationResult, DEFAULT_PROCESSING_OPTIONS } from '@/utils/fileProcessing';
import { useToast } from '@/hooks/use-toast';
import { ProgressStep } from '@/components/FileUpload/ProgressTracker';

export interface UseFileUploadOptions {
  maxFileSize?: number;
  maxRows?: number;
  allowedFormats?: string[];
  targetUserId?: string;
  maxRetries?: number;
  retryDelay?: number;
  onUploadComplete?: (fileId: string, processedData: ProcessedData) => void;
}

export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  isDragOver: boolean;
  progress: number;
  steps: ProgressStep[];
  currentStep?: string;
  validationResult: FileValidationResult | null;
  error: string | null;
  estimatedTimeRemaining?: string;
  retryCount: number;
  canRetry: boolean;
}

interface ProcessedData {
  success: boolean;
  detectedSheets: string[];
  detectedFields: Record<string, string[]>;
  sheetsData: Array<{
    name: string;
    fields: string[];
    sampleData: Record<string, any>[];
    rowCount?: number;
    hasHeaders?: boolean;
  }>;
  fileName: string;
  fileSize: number;
  processingTime: number;
  message: string;
  performance: {
    fileSize: string;
    processingTime: string;
    estimatedRows: number;
    streamingMode: boolean;
    financialType?: string;
  };
}

const DEFAULT_STEPS: ProgressStep[] = [
  { id: 'validation', label: 'Validando archivo', status: 'pending' },
  { id: 'upload', label: 'Subiendo archivo', status: 'pending' },
  { id: 'parsing', label: 'Analizando estructura', status: 'pending' },
  { id: 'extraction', label: 'Extrayendo datos financieros', status: 'pending' },
  { id: 'validation_data', label: 'Validando consistencia', status: 'pending' },
  { id: 'processing', label: 'Procesando con IA Claude', status: 'pending' },
  { id: 'completion', label: 'Finalizando', status: 'pending' }
];

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const { toast } = useToast();
  const abortController = useRef<AbortController | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    isDragOver: false,
    progress: 0,
    steps: [...DEFAULT_STEPS],
    validationResult: null,
    error: null,
    retryCount: 0,
    canRetry: false
  });

  const updateStep = useCallback((stepId: string, status: ProgressStep['status'], error?: string) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, status, error }
          : step
      ),
      currentStep: stepId
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const estimateTimeRemaining = useCallback((currentProgress: number, startTime: number): string => {
    const elapsed = Date.now() - startTime;
    const rate = currentProgress / elapsed;
    const remaining = (100 - currentProgress) / rate;
    
    const minutes = Math.ceil(remaining / (1000 * 60));
    if (minutes < 1) return '< 1 minuto';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  }, []);

  const simulateProgress = useCallback((stepId: string, duration: number, startProgress: number, endProgress: number) => {
    const startTime = Date.now();
    const progressDiff = endProgress - startProgress;
    
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progressPercentage = Math.min(elapsed / duration, 1);
        const currentProgress = startProgress + (progressDiff * progressPercentage);
        
        updateProgress(currentProgress);
        
        setState(prev => ({
          ...prev,
          estimatedTimeRemaining: estimateTimeRemaining(currentProgress, startTime)
        }));

        if (progressPercentage >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      
      progressInterval.current = interval;
    });
  }, [updateProgress, estimateTimeRemaining]);

  const resetState = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setState({
      file: null,
      isUploading: false,
      isDragOver: false,
      progress: 0,
      steps: [...DEFAULT_STEPS],
      validationResult: null,
      error: null,
      retryCount: 0,
      canRetry: false
    });
  }, []);

  const validateFileAndSetState = useCallback((file: File) => {
    const processingOptions = {
      ...DEFAULT_PROCESSING_OPTIONS,
      ...options
    };
    
    const validationResult = validateFile(file, processingOptions);
    
    setState(prev => ({
      ...prev,
      file,
      validationResult,
      error: validationResult.isValid ? null : validationResult.error || null
    }));

    return validationResult;
  }, [options]);

  const processFile = useCallback(async (file: File, isRetry = false) => {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000;
    
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      error: null,
      progress: 0,
      estimatedTimeRemaining: estimateTimeRemaining(0, startTime),
      retryCount: isRetry ? prev.retryCount + 1 : 0,
      canRetry: false
    }));

    abortController.current = new AbortController();

    try {
      // Step 1: Validation
      updateStep('validation', 'processing');
      await simulateProgress('validation', 500, 0, 10);
      
      const validation = validateFileAndSetState(file);
      if (!validation.isValid) {
        updateStep('validation', 'error', validation.error);
        throw new Error(validation.error);
      }
      
      updateStep('validation', 'completed');

      // Step 2: Upload
      updateStep('upload', 'processing');
      await simulateProgress('upload', 1000, 10, 25);
      
      const base64File = await fileToBase64(file);
      updateStep('upload', 'completed');

      // Step 3: Parsing
      updateStep('parsing', 'processing');
      await simulateProgress('parsing', 1500, 25, 40);

      // Call the simple-excel-parser function with retry logic
      let response;
      let attempts = 0;
      const maxAttempts = isRetry ? 1 : maxRetries;
      
      while (attempts < maxAttempts) {
        try {
          response = await fetch('https://hlwchpmogvwmpuvwmvwv.supabase.co/functions/v1/simple-excel-parser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64File,
              fileName: file.name
            }),
            signal: abortController.current.signal
          });

          if (response.ok) {
            break; // Success, exit retry loop
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Attempt ${attempts} failed, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } catch (fetchError: any) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw fetchError;
          }
          console.log(`Network error on attempt ${attempts}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status || 'Network Error'}`);
      }

      const result = await response.json();
      updateStep('parsing', 'completed');

      if (!result.success) {
        const isRetryable = result.retryable !== false;
        setState(prev => ({ ...prev, canRetry: isRetryable }));
        throw new Error(result.error || 'Error parsing file');
      }

      // Step 4: Extraction
      updateStep('extraction', 'processing');
      await simulateProgress('extraction', 2000, 40, 65);
      updateStep('extraction', 'completed');

      // Step 5: Data Validation
      updateStep('validation_data', 'processing');
      await simulateProgress('validation_data', 1000, 65, 80);
      updateStep('validation_data', 'completed');

      // Step 6: AI Processing
      updateStep('processing', 'processing');
      await simulateProgress('processing', 2000, 80, 95);
      updateStep('processing', 'completed');

      // Step 7: Completion
      updateStep('completion', 'processing');
      await simulateProgress('completion', 500, 95, 100);
      updateStep('completion', 'completed');

      // Success
      setState(prev => ({ 
        ...prev, 
        isUploading: false,
        estimatedTimeRemaining: undefined,
        error: null,
        canRetry: false
      }));

      toast({
        title: "Archivo procesado exitosamente",
        description: `${file.name} ha sido analizado correctamente`,
      });

      if (options.onUploadComplete) {
        options.onUploadComplete(result.file_id || 'mock-id', result);
      }

      return result;

    } catch (error: any) {
      console.error('File upload error:', error);
      
      const isRetryable = !error.message.includes('too large') && 
                         !error.message.includes('not supported') &&
                         state.retryCount < maxRetries;
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: error.message,
        estimatedTimeRemaining: undefined,
        canRetry: isRetryable
      }));

      // Mark current step as error
      if (state.currentStep) {
        updateStep(state.currentStep, 'error', error.message);
      }

      toast({
        title: "Error al procesar archivo",
        description: error.message || "Hubo un problema procesando tu archivo",
        variant: "destructive"
      });

      throw error;
    }
  }, [
    updateStep, 
    simulateProgress, 
    validateFileAndSetState, 
    estimateTimeRemaining, 
    options, 
    toast,
    state.currentStep,
    state.retryCount
  ]);

  const retryUpload = useCallback(() => {
    if (state.file && state.canRetry) {
      return processFile(state.file, true);
    }
  }, [state.file, state.canRetry, processFile]);

  const handleFileSelection = useCallback((file: File) => {
    const validation = validateFileAndSetState(file);
    
    if (validation.isValid) {
      return processFile(file);
    } else {
      toast({
        title: "Archivo no válido",
        description: validation.error,
        variant: "destructive"
      });
    }
  }, [validateFileAndSetState, processFile, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    resetState();
    
    toast({
      title: "Subida cancelada",
      description: "La subida del archivo ha sido cancelada",
    });
  }, [resetState, toast]);

  return {
    ...state,
    handleFileSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    cancelUpload,
    resetState,
    retryUpload
  };
};