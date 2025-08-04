/**
 * File processing utilities for optimized file upload system
 * Handles file validation, size limits, and format detection
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize: number;
  fileType: string;
}

export interface FileProcessingOptions {
  maxFileSize: number; // in bytes
  maxRows: number;
  allowedFormats: string[];
}

// Default configuration for optimal performance
export const DEFAULT_PROCESSING_OPTIONS: FileProcessingOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxRows: 50000, // 50K rows
  allowedFormats: ['.xlsx', '.xls', '.csv']
};

/**
 * Validates file before processing
 */
export function validateFile(file: File, options: FileProcessingOptions = DEFAULT_PROCESSING_OPTIONS): FileValidationResult {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  // Check file format
  if (!options.allowedFormats.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Formato no soportado. Formatos permitidos: ${options.allowedFormats.join(', ')}`,
      fileSize: file.size,
      fileType: fileExtension
    };
  }

  // Check file size
  if (file.size > options.maxFileSize) {
    const maxSizeMB = Math.round(options.maxFileSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      isValid: false,
      error: `Archivo demasiado grande (${fileSizeMB}MB). Tamaño máximo: ${maxSizeMB}MB`,
      fileSize: file.size,
      fileType: fileExtension
    };
  }

  return {
    isValid: true,
    fileSize: file.size,
    fileType: fileExtension
  };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Detects file type based on content and extension
 */
export function detectFileType(file: File): 'excel' | 'csv' | 'unknown' {
  const extension = file.name.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'csv':
      return 'csv';
    default:
      return 'unknown';
  }
}

/**
 * Creates a preview of file information
 */
export function createFilePreview(file: File) {
  const validation = validateFile(file);
  const type = detectFileType(file);
  
  return {
    name: file.name,
    size: formatFileSize(file.size),
    sizeBytes: file.size,
    type,
    lastModified: new Date(file.lastModified),
    validation
  };
}

/**
 * Converts file to base64 for API transmission
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data:mime;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Estimates processing time based on file size
 */
export function estimateProcessingTime(fileSizeBytes: number): string {
  // Rough estimates based on file size
  const sizeMB = fileSizeBytes / (1024 * 1024);
  
  if (sizeMB < 1) return '< 1 minuto';
  if (sizeMB < 5) return '1-2 minutos';
  if (sizeMB < 15) return '2-5 minutos';
  if (sizeMB < 30) return '5-10 minutos';
  return '10-15 minutos';
}

/**
 * Creates a preview of file content for CSV files
 */
export async function createFileContentPreview(file: File, maxLines = 5): Promise<{
  hasPreview: boolean;
  headers: string[];
  sampleRows: string[][];
  totalEstimatedRows: number;
}> {
  if (detectFileType(file) !== 'csv') {
    return {
      hasPreview: false,
      headers: [],
      sampleRows: [],
      totalEstimatedRows: 0
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
          resolve({
            hasPreview: false,
            headers: [],
            sampleRows: [],
            totalEstimatedRows: 0
          });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const sampleRows = lines.slice(1, maxLines + 1).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );

        resolve({
          hasPreview: true,
          headers,
          sampleRows,
          totalEstimatedRows: lines.length - 1 // Subtract header row
        });
      } catch (error) {
        console.error('Error creating file preview:', error);
        resolve({
          hasPreview: false,
          headers: [],
          sampleRows: [],
          totalEstimatedRows: 0
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        hasPreview: false,
        headers: [],
        sampleRows: [],
        totalEstimatedRows: 0
      });
    };

    // Read only first 50KB for preview to avoid memory issues
    const previewSize = Math.min(file.size, 50 * 1024);
    const blob = file.slice(0, previewSize);
    reader.readAsText(blob);
  });
}