import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

type FileType = 'pyg' | 'balance' | 'cashflow';

interface ValidationPreviewProps {
  data: any[];
  fileType: FileType;
}

export function ValidationPreview({ data, fileType }: ValidationPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  const headers = Object.keys(data[0]).filter(key => !key.startsWith('_'));
  const requiredColumns = fileType === 'balance' 
    ? ['Seccion', 'Concepto', 'Periodo', 'Año', 'Importe']
    : ['Concepto', 'Periodo', 'Año', 'Importe'];

  // Check column mapping
  const columnMappings: Record<string, string> = {};
  const missingColumns: string[] = [];

  requiredColumns.forEach(required => {
    const found = headers.find(header => {
      const lowerHeader = header.toLowerCase();
      const lowerRequired = required.toLowerCase();
      
      // Direct match or common variations
      return lowerHeader === lowerRequired ||
             lowerHeader.includes(lowerRequired) ||
             (required === 'Año' && (lowerHeader.includes('ano') || lowerHeader.includes('anio')));
    });

    if (found) {
      columnMappings[required] = found;
    } else {
      missingColumns.push(required);
    }
  });

  // Sample validation
  const validationResults = {
    totalRows: data.length,
    validRows: 0,
    warnings: [] as string[],
    errors: [] as string[]
  };

  // Validate sample rows
  data.slice(0, 10).forEach((row, index) => {
    let isValid = true;

    // Check required fields
    Object.entries(columnMappings).forEach(([required, mapped]) => {
      const value = row[mapped];
      if (!value || String(value).trim() === '') {
        validationResults.errors.push(`Fila ${index + 2}: ${required} está vacío`);
        isValid = false;
      }
    });

    // Validate specific fields
    if (columnMappings['Año']) {
      const year = parseInt(String(row[columnMappings['Año']]));
      if (isNaN(year) || year < 1900 || year > 2100) {
        validationResults.errors.push(`Fila ${index + 2}: Año inválido`);
        isValid = false;
      }
    }

    if (columnMappings['Importe']) {
      const amount = String(row[columnMappings['Importe']]).replace(/\./g, '').replace(',', '.');
      if (isNaN(parseFloat(amount))) {
        validationResults.errors.push(`Fila ${index + 2}: Importe inválido`);
        isValid = false;
      }
    }

    // Balance section validation
    if (fileType === 'balance' && columnMappings['Seccion']) {
      const section = String(row[columnMappings['Seccion']]).toLowerCase();
      const validSections = ['activo', 'pasivo', 'patrimonio neto', 'patrimonio', 'pn', 'fondos propios'];
      if (!validSections.some(valid => section.includes(valid))) {
        validationResults.warnings.push(`Fila ${index + 2}: Sección "${row[columnMappings['Seccion']]}" será normalizada`);
      }
    }

    if (isValid) {
      validationResults.validRows++;
    }
  });

  const hasErrors = missingColumns.length > 0 || validationResults.errors.length > 0;
  const hasWarnings = validationResults.warnings.length > 0;

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            Validación de Datos
          </CardTitle>
          <CardDescription>
            Vista previa y validación de las primeras {Math.min(data.length, 50)} filas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Column Mapping */}
          <div>
            <h4 className="font-medium mb-2">Mapeo de Columnas</h4>
            <div className="flex flex-wrap gap-2">
              {requiredColumns.map(col => {
                const mapped = columnMappings[col];
                return (
                  <Badge 
                    key={col}
                    variant={mapped ? "default" : "destructive"}
                  >
                    {col}: {mapped ? `✓ ${mapped}` : '✗ No encontrada'}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{data.length.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Filas totales</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validationResults.validRows}</div>
              <div className="text-sm text-muted-foreground">Filas válidas (muestra)</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">{validationResults.errors.length}</div>
              <div className="text-sm text-muted-foreground">Errores detectados</div>
            </div>
          </div>

          {/* Alerts */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Errores encontrados:</div>
                  {missingColumns.map(col => (
                    <div key={col}>• Columna obligatoria "{col}" no encontrada</div>
                  ))}
                  {validationResults.errors.slice(0, 3).map((error, i) => (
                    <div key={i}>• {error}</div>
                  ))}
                  {validationResults.errors.length > 3 && (
                    <div>• ... y {validationResults.errors.length - 3} errores más</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {hasWarnings && !hasErrors && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Advertencias:</div>
                  {validationResults.warnings.slice(0, 3).map((warning, i) => (
                    <div key={i}>• {warning}</div>
                  ))}
                  {validationResults.warnings.length > 3 && (
                    <div>• ... y {validationResults.warnings.length - 3} advertencias más</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!hasErrors && !hasWarnings && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Los datos parecen estar en formato correcto. Listos para procesar.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de Datos</CardTitle>
          <CardDescription>
            Primeras {Math.min(data.length, 10)} filas del archivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  {headers.slice(0, 6).map(header => (
                    <TableHead key={header} className="min-w-32">
                      {header}
                      {requiredColumns.includes(header) && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </TableHead>
                  ))}
                  {headers.length > 6 && (
                    <TableHead>...</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {row._rowNumber || index + 2}
                    </TableCell>
                    {headers.slice(0, 6).map(header => (
                      <TableCell key={header} className="max-w-32 truncate">
                        {String(row[header] || '')}
                      </TableCell>
                    ))}
                    {headers.length > 6 && (
                      <TableCell className="text-muted-foreground">
                        +{headers.length - 6} más
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}