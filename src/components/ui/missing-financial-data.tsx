import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertTriangle, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

interface MissingFinancialDataProps {
  dataType: 'cashflow' | 'balance' | 'pyg' | 'operational' | 'debt' | 'ratios';
  onUploadClick?: () => void;
  className?: string;
}

const dataTypeConfig = {
  cashflow: {
    title: 'Faltan Datos de Flujos de Efectivo',
    description: 'Para realizar el análisis de flujos de caja necesitamos que subas el Estado de Flujos de Efectivo.',
    templateName: 'estado-flujos.csv',
    icon: DollarSign,
    color: 'border-blue-200 bg-blue-50'
  },
  balance: {
    title: 'Faltan Datos del Balance',
    description: 'Para calcular el NOF necesitamos los datos del Balance de Situación.',
    templateName: 'balance-situacion.csv',
    icon: BarChart3,
    color: 'border-green-200 bg-green-50'
  },
  pyg: {
    title: 'Faltan Datos de P&G',
    description: 'Para el análisis analítico necesitamos la Cuenta de Pérdidas y Ganancias.',
    templateName: 'cuenta-pyg.csv',
    icon: TrendingUp,
    color: 'border-purple-200 bg-purple-50'
  },
  operational: {
    title: 'Faltan Datos Operativos',
    description: 'Para el análisis por segmentos necesitamos datos operativos y de ventas.',
    templateName: 'datos-operativos.csv',
    icon: BarChart3,
    color: 'border-orange-200 bg-orange-50'
  },
  debt: {
    title: 'Faltan Datos de Deuda',
    description: 'Para el análisis del servicio de deuda necesitamos información de préstamos y vencimientos.',
    templateName: 'pool-deuda.csv',
    icon: AlertTriangle,
    color: 'border-red-200 bg-red-50'
  },
  ratios: {
    title: 'Faltan Datos para Ratios',
    description: 'Para calcular ratios financieros necesitamos datos del Balance y P&G.',
    templateName: 'balance-situacion.csv',
    icon: BarChart3,
    color: 'border-indigo-200 bg-indigo-50'
  }
};

export const MissingFinancialData: React.FC<MissingFinancialDataProps> = ({
  dataType,
  onUploadClick,
  className = ''
}) => {
  const config = dataTypeConfig[dataType];
  const Icon = config.icon;

  return (
    <Card className={`${config.color} border-2 ${className}`}>
      <CardContent className="p-8 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-white/80 shadow-sm">
              <Icon className="h-8 w-8 text-slate-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-slate-900">
              {config.title}
            </h3>
            <p className="text-slate-700 text-base leading-relaxed max-w-md mx-auto">
              {config.description}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onUploadClick}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir Datos
              </Button>
              
              <Button 
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Download template logic
                  const link = document.createElement('a');
                  link.href = `/templates/${config.templateName}`;
                  link.download = config.templateName;
                  link.click();
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>
            
            <div className="text-sm text-slate-600 bg-white/60 rounded-lg p-3">
              <span className="font-medium">Plantilla:</span> {config.templateName}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};