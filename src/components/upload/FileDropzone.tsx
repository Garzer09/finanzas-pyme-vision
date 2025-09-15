import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

type FileType = 'pyg' | 'balance' | 'cashflow';

interface FileDropzoneProps {
  fileType: FileType;
  onFileUpload: (file: File, preview: any[]) => void;
}

export function FileDropzone({ fileType, onFileUpload }: FileDropzoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const [header, ...dataLines] = lines;
    const headers = header.split(/[,;]/).map(h => h.trim().replace(/"/g, ''));
    
    return dataLines.slice(0, 50).map((line, index) => {
      const values = line.split(/[,;]/).map(v => v.trim().replace(/"/g, ''));
      const row: any = { _rowNumber: index + 2 };
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });
  };

  const parseXLSX = (buffer: ArrayBuffer): any[] => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length < 2) return [];

    const [headers, ...rows] = data as any[][];
    
    return rows.slice(0, 50).map((row: any[], index: number) => {
      const rowData: any = { _rowNumber: index + 2 };
      headers.forEach((header: string, i: number) => {
        rowData[header] = row[i] || '';
      });
      return rowData;
    });
  };

  const validateFile = (file: File): string | null => {
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      return 'El archivo excede el límite de 20MB';
    }

    // Check file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.endsWith('.csv') || 
                       file.name.endsWith('.xlsx') || 
                       file.name.endsWith('.xls');

    if (!isValidType) {
      return 'Solo se permiten archivos CSV o XLSX';
    }

    return null;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const buffer = await file.arrayBuffer();
      let previewData: any[] = [];

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = new TextDecoder().decode(buffer);
        previewData = parseCSV(text);
      } else {
        previewData = parseXLSX(buffer);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (previewData.length === 0) {
        throw new Error('No se pudieron leer datos del archivo');
      }

      // Basic validation for required columns
      const requiredColumns = fileType === 'balance' 
        ? ['Seccion', 'Concepto', 'Periodo', 'Año', 'Importe']
        : ['Concepto', 'Periodo', 'Año', 'Importe'];

      const headers = Object.keys(previewData[0]).filter(key => !key.startsWith('_'));
      const missingColumns = requiredColumns.filter(col => 
        !headers.some(header => 
          header.toLowerCase().includes(col.toLowerCase()) ||
          (col === 'Año' && (header.toLowerCase().includes('ano') || header.toLowerCase().includes('anio')))
        )
      );

      if (missingColumns.length > 0) {
        throw new Error(`Faltan columnas obligatorias: ${missingColumns.join(', ')}`);
      }

      setSelectedFile(file);
      onFileUpload(file, previewData);
      toast.success('Archivo procesado correctamente');

    } catch (error) {
      toast.error('Error al procesar archivo: ' + String(error));
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    await processFile(file);
  }, [fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const fileTypeTitle = {
    pyg: 'Pérdidas y Ganancias',
    balance: 'Balance de Situación',
    cashflow: 'Flujo de Efectivo'
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Subir Archivo: {fileTypeTitle[fileType]}
          </CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV o XLSX, o haz clic para seleccionarlo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                }
                ${isProcessing ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                {isProcessing ? (
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Procesando archivo...</div>
                    <Progress value={uploadProgress} className="w-64 mx-auto" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg font-medium">
                      {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo aquí'}
                    </div>
                    <div className="text-muted-foreground">
                      o <Button variant="link" className="p-0 h-auto">selecciona un archivo</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Formatos: CSV, XLSX • Máximo: 20MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Archivo cargado correctamente. En el siguiente paso podrás ver una vista previa 
                  y decidir si procesarlo.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisitos del Archivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Columnas obligatorias:</span>{' '}
              {fileType === 'balance' 
                ? 'Seccion, Concepto, Periodo, Año, Importe'
                : 'Concepto, Periodo, Año, Importe'
              }
            </div>
            <div>
              <span className="font-medium">Formato de período:</span> YYYY-MM (ej: 2024-01) o número de mes
            </div>
            <div>
              <span className="font-medium">Formato de importe:</span> Números con punto o coma decimal
            </div>
            {fileType === 'balance' && (
              <div>
                <span className="font-medium">Secciones válidas:</span> Activo, Pasivo, Patrimonio Neto (o variantes)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}