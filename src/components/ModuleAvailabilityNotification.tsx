import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  ArrowRight, 
  BarChart3, 
  TrendingUp,
  Target,
  PieChart,
  Calculator,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleNotificationProps {
  processedData: any;
  onClose: () => void;
}

export const ModuleAvailabilityNotification: React.FC<ModuleNotificationProps> = ({
  processedData,
  onClose
}) => {
  const getModuleIcon = (moduleRoute: string) => {
    if (moduleRoute.includes('ratio')) return <Calculator className="h-5 w-5" />;
    if (moduleRoute.includes('balance')) return <BarChart3 className="h-5 w-5" />;
    if (moduleRoute.includes('pyg') || moduleRoute.includes('cuenta')) return <TrendingUp className="h-5 w-5" />;
    if (moduleRoute.includes('flujo')) return <PieChart className="h-5 w-5" />;
    if (moduleRoute.includes('proyect')) return <Target className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getModuleName = (moduleRoute: string) => {
    const names = {
      '/cuenta-pyg': 'Cuenta P&G',
      '/balance-situacion': 'Balance de Situación', 
      '/ratios-financieros': 'Ratios Financieros',
      '/flujos-caja': 'Flujos de Caja',
      '/endeudamiento': 'Análisis de Endeudamiento',
      '/servicio-deuda': 'Servicio de Deuda',
      '/pyg-actual': 'P&G Actual',
      '/balance-actual': 'Balance Actual',
      '/ratios-actual': 'Ratios Actuales',
      '/flujos-actual': 'Flujos Actuales',
      '/pyg-proyectado': 'P&G Proyectado',
      '/balance-proyectado': 'Balance Proyectado',
      '/flujos-proyectado': 'Flujos Proyectados'
    };
    return names[moduleRoute] || moduleRoute.replace('/', '').replace('-', ' ');
  };

  const availableModules = [
    '/cuenta-pyg',
    '/balance-situacion', 
    '/ratios-financieros',
    '/flujos-caja'
  ];

  const keyInsights = [];
  
  // Generar insights automáticamente
  if (processedData.estados_financieros?.pyg) {
    keyInsights.push('Estados financieros P&G detectados');
  }
  if (processedData.estados_financieros?.balance) {
    keyInsights.push('Balance de situación identificado');
  }
  if (processedData.ratios_financieros) {
    keyInsights.push('Ratios financieros calculados');
  }
  if (processedData.pool_financiero) {
    keyInsights.push('Pool financiero analizado');
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <CardTitle className="text-steel-blue-dark">¡Datos Procesados Exitosamente!</CardTitle>
              <CardDescription>
                {availableModules.length} módulos del dashboard están listos para usar
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Insights clave */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Datos extraídos automáticamente:</p>
              <div className="flex flex-wrap gap-2">
                {keyInsights.map((insight, idx) => (
                  <Badge key={idx} variant="default" className="bg-green-100 text-green-800">
                    {insight}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Módulos disponibles */}
        <div>
          <h3 className="text-lg font-semibold text-steel-blue-dark mb-4">
            Módulos Listos para Análisis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModules.map((moduleRoute, idx) => (
              <Link key={idx} to={moduleRoute} className="block">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getModuleIcon(moduleRoute)}
                        <div>
                          <h4 className="font-semibold text-steel-blue-dark">
                            {getModuleName(moduleRoute)}
                          </h4>
                          <p className="text-sm text-professional">
                            Datos listos para análisis
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-steel-blue" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-4 justify-center">
          <Link to="/home">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Dashboard Principal
            </Button>
          </Link>
          <Link to="/archivos">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Gestionar Archivos
            </Button>
          </Link>
          <Link to="/ratios-financieros">
            <Button>
              <Calculator className="h-4 w-4 mr-2" />
              Ir a Ratios
            </Button>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="text-center">
          <p className="text-sm text-professional">
            Los datos se han guardado automáticamente y están disponibles en todos los módulos correspondientes.
            Puedes editarlos o agregar información adicional en cualquier momento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};