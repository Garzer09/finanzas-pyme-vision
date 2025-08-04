// File validation utility for upload system
// Optimized for production with clear error messages and recovery suggestions

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    formattedSize: string;
  };
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

// Default configuration - optimized for financial files
const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB limit
  allowedTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv'
  ],
  allowedExtensions: ['.xlsx', '.xls', '.csv']
};

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/**
 * Validate file before upload with comprehensive checks
 */
export function validateFile(
  file: File, 
  options: FileValidationOptions = {}
): FileValidationResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    formattedSize: formatFileSize(file.size)
  };

  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No se ha seleccionado ningún archivo',
      suggestion: 'Por favor, selecciona un archivo para continuar'
    };
  }

  // Check file size
  if (file.size > config.maxSizeBytes) {
    const maxSizeFormatted = formatFileSize(config.maxSizeBytes);
    return {
      isValid: false,
      error: `El archivo es demasiado grande (${fileInfo.formattedSize})`,
      suggestion: `El tamaño máximo permitido es ${maxSizeFormatted}. Intenta comprimir el archivo o dividirlo en partes más pequeñas`,
      fileInfo
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'El archivo está vacío',
      suggestion: 'Verifica que el archivo contenga datos antes de subirlo',
      fileInfo
    };
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!config.allowedExtensions.includes(extension)) {
    const allowedFormats = config.allowedExtensions.join(', ');
    return {
      isValid: false,
      error: `Formato de archivo no compatible (${extension})`,
      suggestion: `Los formatos soportados son: ${allowedFormats}. Convierte tu archivo a uno de estos formatos`,
      fileInfo
    };
  }

  // Check MIME type (additional security)
  if (file.type && !config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de archivo no válido',
      suggestion: 'Asegúrate de que el archivo sea un Excel (.xlsx, .xls) o CSV válido',
      fileInfo
    };
  }

  // Check filename for problematic characters
  const problematicChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (problematicChars.test(file.name)) {
    return {
      isValid: false,
      error: 'El nombre del archivo contiene caracteres no válidos',
      suggestion: 'Renombra el archivo eliminando caracteres especiales como <, >, :, ", /, \\, |, ?, *',
      fileInfo
    };
  }

  // All validations passed
  return {
    isValid: true,
    fileInfo
  };
}

/**
 * Get file type description for user display
 */
export function getFileTypeDescription(file: File): string {
  const extension = getFileExtension(file.name);
  
  switch (extension) {
    case '.xlsx':
      return 'Excel (nuevo formato)';
    case '.xls':
      return 'Excel (formato clásico)';
    case '.csv':
      return 'Archivo CSV';
    default:
      return 'Archivo desconocido';
  }
}

/**
 * Check if file appears to be a financial document based on name
 */
export function detectFinancialDocumentType(filename: string): string | null {
  const nameLower = filename.toLowerCase();
  
  if (nameLower.includes('balance') || nameLower.includes('situacion')) {
    return 'Balance de Situación';
  } else if (nameLower.includes('pyg') || nameLower.includes('perdidas') || nameLower.includes('ganancias')) {
    return 'Cuenta de Pérdidas y Ganancias';
  } else if (nameLower.includes('flujo') || nameLower.includes('cash')) {
    return 'Flujo de Caja';
  } else if (nameLower.includes('mayor') || nameLower.includes('ledger') || nameLower.includes('libro')) {
    return 'Libro Mayor';
  }
  
  return null;
}

/**
 * Estimate processing time based on file size
 */
export function estimateProcessingTime(fileSize: number): string {
  // Base processing time estimates (in seconds)
  const baseTimes = {
    small: 2,   // < 1MB
    medium: 5,  // 1-10MB  
    large: 15,  // 10-50MB
  };
  
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB < 1) {
    return `~${baseTimes.small} segundos`;
  } else if (sizeMB < 10) {
    const estimated = baseTimes.small + Math.round((sizeMB - 1) * 0.5);
    return `~${estimated} segundos`;
  } else {
    const estimated = baseTimes.medium + Math.round((sizeMB - 10) * 0.25);
    return `~${estimated} segundos`;
  }
}