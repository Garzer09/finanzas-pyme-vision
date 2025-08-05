import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  FileText, 
  Calendar, 
  Building2, 
  TrendingUp,
  Database,
  AlertTriangle
} from 'lucide-react';

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

interface ProcessingConfirmationProps {
  files: ParsedFileData[];
  companyInfo: {
    companyId: string;
    company_name: string;
    currency_code: string;
    accounting_standard: string;
  };
  onConfirm: () => void;
  isProcessing: boolean;
}

export const ProcessingConfirmation: React.FC<ProcessingConfirmationProps> = ({
  files,
  companyInfo,
  onConfirm,
  isProcessing
}) => {
  const totalRecords = files.reduce((acc, file) => acc + file.data.length, 0);
  const allYears = [...new Set(files.flatMap(f => f.detectedYears))].sort();
  const hasChanges = files.some(file => 
    JSON.stringify(file.data) !== JSON.stringify(file.originalData)
  );

  const getFileTypeIcon = (canonicalName: string) => {
    if (canonicalName.includes('pyg')) return '📊';
    if (canonicalName.includes('balance')) return '⚖️';
    if (canonicalName.includes('flujo')) return '💰';
    if (canonicalName.includes('deuda')) return '🏦';
    if (canonicalName.includes('operativo')) return '🔧';
    return '📄';
  };

  const getFileDescription = (canonicalName: string) => {
    const descriptions = {
      'cuenta-pyg.csv': 'Cuenta de Pérdidas y Ganancias',
      'balance-situacion.csv': 'Balance de Situación',
      'estado-flujos.csv': 'Estado de Flujos de Efectivo',
      'pool-deuda.csv': 'Pool de Deuda',
      'pool-deuda-vencimientos.csv': 'Vencimientos de Deuda',
      'datos-operativos.csv': 'Datos Operativos',
      'supuestos-financieros.csv': 'Supuestos Financieros'
    };
    return descriptions[canonicalName] || canonicalName;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium">{companyInfo.company_name}</p>
                <p className="text-xs text-muted-foreground">{companyInfo.currency_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Registros Totales</p>
                <p className="font-medium text-2xl">{totalRecords}</p>
                <p className="text-xs text-muted-foreground">{files.length} archivos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Períodos</p>
                <p className="font-medium">{allYears.length} años</p>
                <p className="text-xs text-muted-foreground">
                  {allYears.length > 0 ? `${allYears[0]} - ${allYears[allYears.length - 1]}` : 'Sin años'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Se detectaron cambios manuales en los datos</p>
              <p className="text-sm">
                Los archivos han sido modificados durante la revisión. Estos cambios se incluirán en el procesamiento.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Files to Process */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos a Procesar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={file.fileName} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileTypeIcon(file.canonicalName)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getFileDescription(file.canonicalName)}</span>
                      <Badge variant="outline">{file.data.length} filas</Badge>
                      {JSON.stringify(file.data) !== JSON.stringify(file.originalData) && (
                        <Badge variant="secondary">Modificado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {file.fileName} • Años: {file.detectedYears.join(', ')}
                    </p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Procesamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Datos que se crearán:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Estados financieros para {allYears.length} período{allYears.length !== 1 ? 's' : ''}</li>
                  <li>• Ratios financieros automáticos</li>
                  <li>• KPIs y métricas calculadas</li>
                  <li>• Datos históricos para análisis de tendencias</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Configuración:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Moneda: {companyInfo.currency_code}</li>
                  <li>• Estándar contable: {companyInfo.accounting_standard}</li>
                  <li>• Modo: Reemplazar datos existentes</li>
                  <li>• Validaciones: Activadas</li>
                </ul>
              </div>
            </div>

            {allYears.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Los datos existentes para los años {allYears.join(', ')} 
                  serán reemplazados. Esta acción no se puede deshacer.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">¿Proceder con la carga de datos?</p>
              <p className="text-sm text-muted-foreground">
                Los datos serán procesados y guardados en la base de datos
              </p>
            </div>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar y Procesar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};