import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import { ValuationData } from '@/hooks/useValuation';

interface HorizonSelectorProps {
  valuationData: ValuationData;
  onHorizonChange: (horizon: number) => void;
}

export const HorizonSelector = ({ valuationData, onHorizonChange }: HorizonSelectorProps) => {
  const { horizon, dataStatus } = valuationData;

  const horizonOptions = [
    { value: 3, label: '3 años', description: 'Recomendado para el cliente' },
    { value: 5, label: '5 años', description: 'Estándar de mercado' },
    { value: 10, label: '10 años', description: 'Largo plazo' }
  ];

  const getDataAvailability = (years: number) => {
    if (dataStatus.availableYears.length === 0) return 'sin-datos';
    const availableHistoricalYears = dataStatus.availableYears.length;
    
    if (availableHistoricalYears >= years) return 'completo';
    if (availableHistoricalYears >= Math.ceil(years / 2)) return 'parcial';
    return 'insuficiente';
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'completo': return 'text-success';
      case 'parcial': return 'text-warning';
      case 'insuficiente': return 'text-destructive';
      case 'sin-datos': return 'text-slate-400';
      default: return 'text-slate-600';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'completo': return 'Datos completos';
      case 'parcial': return 'Datos parciales';
      case 'insuficiente': return 'Datos insuficientes';
      case 'sin-datos': return 'Sin datos históricos';
      default: return 'Estado desconocido';
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Horizonte de Valoración
        </CardTitle>
        <p className="text-sm text-slate-600">
          Configura el período de proyección para el análisis DCF
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horizon Selector */}
        <div className="space-y-2">
          <Label htmlFor="horizon-select" className="text-sm font-medium text-slate-700">
            Período de análisis
          </Label>
          <Select
            value={horizon.toString()}
            onValueChange={(value) => onHorizonChange(Number(value))}
          >
            <SelectTrigger id="horizon-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {horizonOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-slate-500">{option.description}</span>
                    </div>
                    <div className={`ml-4 flex items-center gap-1 text-xs ${getAvailabilityColor(getDataAvailability(option.value))}`}>
                      <Clock className="h-3 w-3" />
                      {getAvailabilityText(getDataAvailability(option.value))}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Status Summary */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Estado de Datos Disponibles</h4>
          
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Años históricos disponibles:</span>
              <span className="font-medium text-slate-900">
                {dataStatus.availableYears.length > 0 
                  ? dataStatus.availableYears.join(', ') 
                  : 'Ninguno'
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Estados financieros:</span>
              <span className={`font-medium ${dataStatus.hasFinancialData ? 'text-success' : 'text-destructive'}`}>
                {dataStatus.hasFinancialData ? 'Disponibles' : 'No disponibles'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Datos de deuda:</span>
              <span className={`font-medium ${dataStatus.hasDebtData ? 'text-success' : 'text-destructive'}`}>
                {dataStatus.hasDebtData ? 'Disponibles' : 'No disponibles'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Supuestos financieros:</span>
              <span className={`font-medium ${dataStatus.hasAssumptions ? 'text-success' : 'text-destructive'}`}>
                {dataStatus.hasAssumptions ? 'Disponibles' : 'No disponibles'}
              </span>
            </div>
          </div>

          {dataStatus.missingData.length > 0 && (
            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-xs text-warning-foreground font-medium">
                Datos faltantes: {dataStatus.missingData.join(', ')}
              </p>
              <p className="text-xs text-warning-foreground/80 mt-1">
                La valoración usará datos simulados donde no estén disponibles los datos reales.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};