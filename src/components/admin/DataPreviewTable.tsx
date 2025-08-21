import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Edit3, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle,
  Calculator,
  Eye,
  EyeOff
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

interface DataPreviewTableProps {
  files: ParsedFileData[];
  onDataEdited: (fileName: string, updatedData: Array<{ [key: string]: string | number }>) => void;
  onValidationChange: (errors: string[]) => void;
  onResetFile: (fileName: string) => void;
}

interface CellError {
  row: number;
  column: string;
  error: string;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  files,
  onDataEdited,
  onValidationChange,
  onResetFile
}) => {
  const [editingCell, setEditingCell] = useState<{fileIndex: number, row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [cellErrors, setCellErrors] = useState<Map<string, CellError[]>>(new Map());
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const { toast } = useToast();

  // Helper function to check if a concept is recognized (simplified)
  const isRecognizedConcept = (concept: string, fileType: string | undefined): boolean => {
    // This is a simplified version - the real implementation would use the backend mapping
    const commonConcepts = {
      'cuenta-pyg.csv': [
        'cifra de negocios', 'ventas', 'ingresos', 'aprovisionamientos', 'compras',
        'gastos de personal', 'sueldos', 'amortización', 'gastos financieros', 'impuestos'
      ],
      'balance-situacion.csv': [
        'activo corriente', 'activo no corriente', 'pasivo corriente', 'pasivo no corriente',
        'patrimonio neto', 'existencias', 'clientes', 'proveedores', 'tesorería', 'efectivo'
      ]
    };
    
    const conceptsForFile = commonConcepts[fileType as keyof typeof commonConcepts] || [];
    const normalizedConcept = concept.toLowerCase().trim();
    
    return conceptsForFile.some(knownConcept => 
      normalizedConcept.includes(knownConcept) || knownConcept.includes(normalizedConcept)
    );
  };

  // Validate data and update errors
  const validateFileData = useCallback((file: ParsedFileData): CellError[] => {
    const errors: CellError[] = [];
    
    if (file.canonicalName === 'balance-situacion.csv') {
      // Balance sheet validation - check if Activo = Pasivo + Patrimonio
      const yearColumns = file.headers.filter(h => 
        file.detectedYears.some(year => h.includes(year.toString())) || h.match(/Año\d+/)
      );
      
      yearColumns.forEach(yearCol => {
        let activo = 0;
        let pasivo = 0;
        let patrimonio = 0;
        
        file.data.forEach((row, index) => {
          const concepto = String(row['Concepto'] || '').toLowerCase();
          const value = parseFloat(String(row[yearCol] || '0').replace(/[^\d.-]/g, '')) || 0;
          
          if (concepto.includes('activo')) {
            activo += value;
          } else if (concepto.includes('pasivo')) {
            pasivo += value;
          } else if (concepto.includes('patrimonio') || concepto.includes('fondos propios')) {
            patrimonio += value;
          }
          
          // Validate individual cells
          if (isNaN(value) && row[yearCol] !== '' && row[yearCol] !== null) {
            errors.push({
              row: index,
              column: yearCol,
              error: 'Valor numérico inválido'
            });
          }
        });
        
        const difference = Math.abs(activo - (pasivo + patrimonio));
        if (difference > 0.01) { // Allow small rounding differences
          errors.push({
            row: -1,
            column: yearCol,
            error: `Balance no cuadra para ${yearCol}: Activo (${activo.toFixed(2)}) ≠ Pasivo + Patrimonio (${(pasivo + patrimonio).toFixed(2)})`
          });
        }
      });
    }
    
    // General validations for all files
    file.data.forEach((row, rowIndex) => {
      file.headers.forEach(header => {
        const value = row[header];
        
        // Check for required concept column
        if (header === 'Concepto' && (!value || String(value).trim() === '')) {
          errors.push({
            row: rowIndex,
            column: header,
            error: 'Concepto requerido'
          });
        }
        
        // Suggest concept mapping for unrecognized concepts
        if (header === 'Concepto' && value && String(value).trim() !== '') {
          const conceptValue = String(value).trim();
          // This is a simplified check - in real implementation, this would call the backend mapping function
          if (!isRecognizedConcept(conceptValue, file.canonicalName)) {
            // This is just a warning, not an error
            // Could be enhanced to show mapping suggestions
          }
        }
        
        // Check numeric columns
        if (file.detectedYears.some(year => header.includes(year.toString())) || header.match(/Año\d+/)) {
          if (value !== '' && value !== null && isNaN(parseFloat(String(value).replace(/[^\d.-]/g, '')))) {
            errors.push({
              row: rowIndex,
              column: header,
              error: 'Debe ser un valor numérico'
            });
          }
        }
      });
    });
    
    return errors;
  }, []);

  // Update validation errors when data changes
  useEffect(() => {
    const newErrors = new Map<string, CellError[]>();
    const allErrors: string[] = [];
    
    files.forEach(file => {
      const fileErrors = validateFileData(file);
      newErrors.set(file.fileName, fileErrors);
      
      fileErrors.forEach(error => {
        allErrors.push(`${file.fileName}: ${error.error}`);
      });
    });
    
    setCellErrors(newErrors);
    onValidationChange(allErrors);
  }, [files, validateFileData, onValidationChange]);

  const startEdit = useCallback((fileIndex: number, row: number, column: string, currentValue: any) => {
    setEditingCell({ fileIndex, row, column });
    setEditValue(String(currentValue || ''));
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const file = files[editingCell.fileIndex];
    const updatedData = [...file.data];
    
    // Parse value based on column type
    let parsedValue: string | number = editValue;
    if (file.detectedYears.some(year => editingCell.column.includes(year.toString())) || editingCell.column.match(/Año\d+/)) {
      const numValue = parseFloat(editValue.replace(/[^\d.-]/g, ''));
      parsedValue = isNaN(numValue) ? editValue : numValue;
    }
    
    updatedData[editingCell.row][editingCell.column] = parsedValue;
    onDataEdited(file.fileName, updatedData);
    
    setEditingCell(null);
    setEditValue('');
    
    toast({
      title: "Celda actualizada",
      description: `Valor actualizado en ${file.fileName}`,
    });
  }, [editingCell, editValue, files, onDataEdited, toast]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const getCellError = useCallback((fileName: string, row: number, column: string): string | null => {
    const fileErrors = cellErrors.get(fileName) || [];
    const error = fileErrors.find(e => e.row === row && e.column === column);
    return error ? error.error : null;
  }, [cellErrors]);

  const hasChanges = useCallback((file: ParsedFileData): boolean => {
    return JSON.stringify(file.data) !== JSON.stringify(file.originalData);
  }, []);

  const getCellClassName = useCallback((fileName: string, row: number, column: string, hasChanges: boolean): string => {
    const error = getCellError(fileName, row, column);
    let classes = "p-2 border text-sm min-w-[120px] relative";
    
    if (error) {
      classes += " bg-red-50 border-red-200";
    } else if (hasChanges) {
      classes += " bg-blue-50 border-blue-200";
    } else {
      classes += " hover:bg-muted/50";
    }
    
    return classes;
  }, [getCellError]);

  const totalErrors = useMemo(() => {
    let count = 0;
    cellErrors.forEach(errors => count += errors.length);
    return count;
  }, [cellErrors]);

  const totalChanges = useMemo(() => {
    return files.filter(hasChanges).length;
  }, [files, hasChanges]);

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {totalErrors > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span className="font-medium">
              {totalErrors === 0 ? 'Validación exitosa' : `${totalErrors} error${totalErrors !== 1 ? 'es' : ''} encontrado${totalErrors !== 1 ? 's' : ''}`}
            </span>
          </div>
          
          {totalChanges > 0 && (
            <Badge variant="outline">
              {totalChanges} archivo{totalChanges !== 1 ? 's' : ''} modificado{totalChanges !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValidationDetails(!showValidationDetails)}
        >
          {showValidationDetails ? <EyeOff /> : <Eye />}
          {showValidationDetails ? 'Ocultar' : 'Mostrar'} Detalles
        </Button>
      </div>

      {/* Validation Details */}
      {showValidationDetails && totalErrors > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Errores de validación:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {Array.from(cellErrors.entries()).map(([fileName, errors]) =>
                  errors.map((error, index) => (
                    <li key={`${fileName}-${index}`}>
                      <strong>{fileName}</strong>: {error.error}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* File Tabs */}
      <Tabs defaultValue={files[0]?.fileName || ''} className="space-y-4">
        <TabsList className="w-full justify-start">
          {files.map((file) => (
            <TabsTrigger key={file.fileName} value={file.fileName} className="relative">
              {file.fileName}
              {cellErrors.get(file.fileName)?.length > 0 && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
              {hasChanges(file) && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {files.map((file) => (
          <TabsContent key={file.fileName} value={file.fileName}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{file.fileName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {file.data.length} filas • {file.detectedYears.length > 0 ? 
                        `Años detectados: ${file.detectedYears.join(', ')}` : 
                        'Sin años detectados'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasChanges(file) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResetFile(file.fileName)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                    )}
                    <Badge variant={cellErrors.get(file.fileName)?.length > 0 ? "destructive" : "default"}>
                      {cellErrors.get(file.fileName)?.length > 0 ? 
                        `${cellErrors.get(file.fileName)?.length} errores` : 
                        'Válido'
                      }
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-96 border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-sm font-medium border-r w-12">#</th>
                        {file.headers.map((header) => (
                          <th key={header} className="p-2 text-left text-sm font-medium border-r min-w-[120px]">
                            {header}
                            {file.detectedYears.some(year => header.includes(year.toString())) && (
                              <Calculator className="inline h-3 w-3 ml-1 text-blue-500" />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {file.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-muted/30">
                          <td className="p-2 text-sm text-muted-foreground border-r bg-muted/50">
                            {rowIndex + 1}
                          </td>
                          {file.headers.map((header) => {
                            const cellError = getCellError(file.fileName, rowIndex, header);
                            const isEditing = editingCell?.fileIndex === files.indexOf(file) && 
                                             editingCell?.row === rowIndex && 
                                             editingCell?.column === header;
                            
                            return (
                              <td 
                                key={header} 
                                className={getCellClassName(file.fileName, rowIndex, header, hasChanges(file))}
                                onClick={() => !isEditing && startEdit(files.indexOf(file), rowIndex, header, row[header])}
                              >
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      className="h-8 text-sm"
                                      autoFocus
                                    />
                                    <Button size="sm" variant="ghost" onClick={saveEdit}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between cursor-pointer group">
                                    <span className="truncate">{String(row[header] || '')}</span>
                                    <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                  </div>
                                )}
                                
                                {cellError && (
                                  <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};