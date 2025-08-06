// React hook for file validation
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedFileProcessor } from '@/services/enhancedFileProcessor';
import type {
  FilePreview,
  ValidationResults,
  ProcessFileRequest,
  ProcessFileResponse,
  TemplateSchema
} from '@/types/templates';

export function useFileValidation() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeFile = useCallback(async (file: File): Promise<FilePreview | null> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const preview = await EnhancedFileProcessor.analyzeFile(file);
      
      if (preview.issues && preview.issues.length > 0) {
        const errorCount = preview.issues.filter(issue => issue.severity === 'error').length;
        const warningCount = preview.issues.filter(issue => issue.severity === 'warning').length;
        
        if (errorCount > 0) {
          toast({
            title: "File Analysis Issues",
            description: `Found ${errorCount} error(s) and ${warningCount} warning(s)`,
            variant: "destructive"
          });
        } else if (warningCount > 0) {
          toast({
            title: "File Analysis Warnings",
            description: `Found ${warningCount} warning(s)`,
            variant: "default"
          });
        }
      }
      
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setAnalysisError(errorMessage);
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const processFile = useCallback(async (file: File): Promise<any> => {
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      const response = await EnhancedFileProcessor.processFile(file);
      
      if (response.success) {
        const validationResults = response.validation_results;
        
        if (validationResults) {
          const { errors, warnings, statistics } = validationResults;
          
          if (errors.length > 0) {
            toast({
              title: "Validation Errors",
              description: `Found ${errors.length} error(s) in ${statistics.total_rows} rows`,
              variant: "destructive"
            });
          } else if (warnings.length > 0) {
            toast({
              title: "Validation Warnings",
              description: `Found ${warnings.length} warning(s) in ${statistics.total_rows} rows`,
              variant: "default"
            });
          } else {
            toast({
              title: "Validation Successful",
              description: `All ${statistics.total_rows} rows validated successfully`,
              variant: "default"
            });
          }
        }
        
        return response;
      } else {
        setProcessingError(response.error || 'Processing failed');
        toast({
          title: "Processing Error",
          description: response.error || 'Processing failed',
          variant: "destructive"
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setProcessingError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const validateAgainstTemplate = useCallback(async (
    file: File,
    template: TemplateSchema,
    customValidations?: any[]
  ): Promise<ValidationResults | null> => {
    try {
      // First analyze the file
      const preview = await analyzeFile(file);
      if (!preview) return null;

      // Parse the file
      const fileText = await file.text();
      const lines = fileText.split('\n').filter(line => line.trim());
      const fileData: any[][] = [];
      
      lines.forEach(line => {
        const row = EnhancedFileProcessor['parseCSVLine'](line, preview.file_metadata.delimiter);
        fileData.push(row);
      });

      // Validate against template
      const validationResults = await EnhancedFileProcessor.validateAgainstTemplate(file, template.id);

      return validationResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  }, [analyzeFile, toast]);

  const clearErrors = useCallback(() => {
    setAnalysisError(null);
    setProcessingError(null);
  }, []);

  return {
    analyzeFile,
    processFile,
    validateAgainstTemplate,
    clearErrors,
    isAnalyzing,
    isProcessing,
    analysisError,
    processingError
  };
}

export function useBatchValidation() {
  const [batchResults, setBatchResults] = useState<Map<string, ValidationResults>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const { toast } = useToast();

  const validateBatch = useCallback(async (
    files: File[],
    template?: TemplateSchema,
    onProgress?: (progress: number, currentFile?: string) => void
  ): Promise<Map<string, ValidationResults>> => {
    setIsValidating(true);
    setValidationProgress(0);
    const results = new Map<string, ValidationResults>();
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        setValidationProgress(progress);
        onProgress?.(progress, file.name);
        
        try {
          const preview = await EnhancedFileProcessor.analyzeFile(file);
          
          if (preview && template) {
            const fileText = await file.text();
            const lines = fileText.split('\n').filter(line => line.trim());
            const fileData: any[][] = [];
            
            lines.forEach(line => {
              const row = EnhancedFileProcessor['parseCSVLine'](line, preview.file_metadata.delimiter);
              fileData.push(row);
            });

            const validationResult = await EnhancedFileProcessor.validateAgainstTemplate(file, template.id);
            
            results.set(file.name, validationResult);
          }
        } catch (fileErr) {
          // Create error result for this file
          results.set(file.name, {
            is_valid: false,
            errors: [{
              message: fileErr instanceof Error ? fileErr.message : 'Validation failed',
              type: 'custom',
              severity: 'error'
            }],
            warnings: [],
            statistics: {
              total_rows: 0,
              valid_rows: 0,
              invalid_rows: 0,
              warnings_count: 0,
              errors_count: 1
            }
          });
        }
      }
      
      setBatchResults(results);
      
      const totalFiles = files.length;
      const validFiles = Array.from(results.values()).filter(r => r.is_valid).length;
      
      toast({
        title: "Batch Validation Complete",
        description: `${validFiles}/${totalFiles} files validated successfully`,
        variant: validFiles === totalFiles ? "default" : "destructive"
      });
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch validation failed';
      toast({
        title: "Batch Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return results;
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const clearBatchResults = useCallback(() => {
    setBatchResults(new Map());
    setValidationProgress(0);
  }, []);

  return {
    validateBatch,
    clearBatchResults,
    batchResults,
    isValidating,
    validationProgress
  };
}