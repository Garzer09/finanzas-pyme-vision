import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParsedFileData {
  fileName: string;
  canonicalName: string;
  data: Array<{ [key: string]: string | number }>;
  originalData: Array<{ [key: string]: string | number }>;
  headers: string[];
  detectedYears: number[];
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

interface CSVFileUploaderProps {
  companyInfo: {
    companyId: string;
    company_name: string;
    currency_code: string;
    accounting_standard: string;
  };
  onFilesUploaded: (files: ParsedFileData[]) => void;
  uploadedFiles: ParsedFileData[];
}

const REQUIRED_FILES = {
  'cuenta-pyg.csv': 'Cuenta de Pérdidas y Ganancias',
  'balance-situacion.csv': 'Balance de Situación'
};

const OPTIONAL_FILES = {
  'pool-deuda.csv': 'Pool de Deuda',
  'pool-deuda-vencimientos.csv': 'Vencimientos de Deuda',
  'estado-flujos.csv': 'Estado de Flujos de Efectivo',
  'datos-operativos.csv': 'Datos Operativos',
  'supuestos-financieros.csv': 'Supuestos Financieros'
};

export const CSVFileUploader: React.FC<CSVFileUploaderProps> = ({
  companyInfo,
  onFilesUploaded,
  uploadedFiles
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCSVFile = useCallback(async (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.trim().split('\n');
          
          if (lines.length < 2) {
            resolve({
              fileName: file.name,
              canonicalName: file.name.toLowerCase(),
              data: [],
              originalData: [],
              headers: [],
              detectedYears: [],
              errors: ['El archivo está vacío o no tiene datos'],
              warnings: [],
              isValid: false
            });
            return;
          }

          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Detect years from headers
          const detectedYears: number[] = [];
          headers.forEach(header => {
            const year = parseInt(header);
            if (!isNaN(year) && year >= 2000 && year <= 2030) {
              detectedYears.push(year);
            } else if (header.match(/Año\d+/)) {
              const currentYear = new Date().getFullYear();
              const yearIndex = parseInt(header.replace('Año', '')) - 1;
              const calculatedYear = currentYear - 2 + yearIndex;
              if (calculatedYear >= 2000 && calculatedYear <= 2030) {
                detectedYears.push(calculatedYear);
              }
            }
          });

          // Parse data rows
          const data: Array<{ [key: string]: string | number }> = [];
          const errors: string[] = [];
          const warnings: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            if (values.length !== headers.length) {
              warnings.push(`Fila ${i + 1}: Número de columnas no coincide con headers`);
              continue;
            }

            const row: { [key: string]: string | number } = {};
            headers.forEach((header, index) => {
              const value = values[index];
              
              // Try to parse as number for year columns
              if (detectedYears.some(year => header.includes(year.toString())) || header.match(/Año\d+/)) {
                const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
                row[header] = isNaN(numValue) ? value : numValue;
              } else {
                row[header] = value;
              }
            });
            
            data.push(row);
          }

          // Validation based on file type
          const canonicalName = file.name.toLowerCase();
          if (canonicalName === 'cuenta-pyg.csv' || canonicalName === 'balance-situacion.csv') {
            if (!headers.includes('Concepto')) {
              errors.push('Se requiere una columna "Concepto"');
            }
            if (detectedYears.length === 0) {
              errors.push('No se detectaron columnas de años válidas');
            }
          }

          resolve({
            fileName: file.name,
            canonicalName,
            data,
            originalData: [...data],
            headers,
            detectedYears: detectedYears.sort(),
            errors,
            warnings,
            isValid: errors.length === 0
          });
        } catch (error) {
          resolve({
            fileName: file.name,
            canonicalName: file.name.toLowerCase(),
            data: [],
            originalData: [],
            headers: [],
            detectedYears: [],
            errors: [`Error parsing file: ${error.message}`],
            warnings: [],
            isValid: false
          });
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const handleFilesDrop = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    
    try {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => 
        file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
      );

      if (validFiles.length === 0) {
        toast({
          title: "Archivos no válidos",
          description: "Solo se permiten archivos CSV",
          variant: "destructive"
        });
        return;
      }

      const parsedFiles = await Promise.all(
        validFiles.map(file => parseCSVFile(file))
      );

      // Merge with existing files, replacing duplicates
      const existingFileNames = uploadedFiles.map(f => f.canonicalName);
      const newFiles = parsedFiles.filter(f => !existingFileNames.includes(f.canonicalName));
      const updatedFiles = [...uploadedFiles, ...newFiles];

      onFilesUploaded(updatedFiles);

      const successCount = parsedFiles.filter(f => f.isValid).length;
      const errorCount = parsedFiles.filter(f => !f.isValid).length;

      if (successCount > 0) {
        toast({
          title: `${successCount} archivo(s) procesado(s)`,
          description: errorCount > 0 ? `${errorCount} archivo(s) con errores` : "Todos los archivos son válidos"
        });
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Error procesando archivos",
        description: "Hubo un problema al procesar los archivos",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSVFile, onFilesUploaded, uploadedFiles, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesDrop(e.dataTransfer.files);
  }, [handleFilesDrop]);

  const removeFile = useCallback((fileName: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.fileName !== fileName);
    onFilesUploaded(updatedFiles);
    
    toast({
      title: "Archivo eliminado",
      description: `${fileName} fue eliminado de la lista`
    });
  }, [uploadedFiles, onFilesUploaded, toast]);

  const getFileStatus = (file: ParsedFileData) => {
    if (!file.isValid) return 'error';
    if (file.warnings.length > 0) return 'warning';
    return 'success';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Válido</Badge>;
      case 'warning':
        return <Badge variant="secondary">Advertencias</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const requiredFilesUploaded = Object.keys(REQUIRED_FILES).filter(
    fileName => uploadedFiles.some(f => f.canonicalName === fileName && f.isValid)
  );

  const missingRequiredFiles = Object.keys(REQUIRED_FILES).filter(
    fileName => !uploadedFiles.some(f => f.canonicalName === fileName)
  );

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">
          Arrastra archivos CSV aquí o haz clic para seleccionar
        </h3>
        <p className="text-muted-foreground mb-4">
          Archivos permitidos: .csv (máximo 40MB por archivo)
        </p>
        
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={(e) => e.target.files && handleFilesDrop(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" asChild>
            <span>Seleccionar Archivos</span>
          </Button>
        </label>

        {isProcessing && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Procesando archivos...</span>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Archivos Obligatorios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(REQUIRED_FILES).map(([fileName, description]) => (
              <div key={fileName} className="flex items-center justify-between">
                <span className="text-sm">{description}</span>
                {uploadedFiles.some(f => f.canonicalName === fileName && f.isValid) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Archivos Opcionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(OPTIONAL_FILES).map(([fileName, description]) => (
              <div key={fileName} className="flex items-center justify-between">
                <span className="text-sm">{description}</span>
                {uploadedFiles.some(f => f.canonicalName === fileName && f.isValid) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      {missingRequiredFiles.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Faltan archivos obligatorios: {missingRequiredFiles.map(f => REQUIRED_FILES[f]).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {requiredFilesUploaded.length === Object.keys(REQUIRED_FILES).length && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Todos los archivos obligatorios han sido cargados correctamente
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Cargados ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.fileName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{file.fileName}</span>
                        {getStatusBadge(getFileStatus(file))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {file.data.length} filas • {file.detectedYears.length > 0 ? 
                          `Años: ${file.detectedYears.join(', ')}` : 
                          'Sin años detectados'
                        }
                      </div>
                      {file.errors.length > 0 && (
                        <div className="text-sm text-red-600">
                          Errores: {file.errors.join(', ')}
                        </div>
                      )}
                      {file.warnings.length > 0 && (
                        <div className="text-sm text-yellow-600">
                          Advertencias: {file.warnings.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.fileName)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};