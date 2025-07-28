import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DebtKPICards } from './DebtKPICards';
import { DebtStackedChart } from './DebtStackedChart';
import { DebtRadarChart } from './DebtRadarChart';
import { BarChart3, Radar } from 'lucide-react';

interface DebtAnalysisSectionProps {
  deudaCorto: number;
  deudaLargo: number;
  activoTotal: number;
  ebitda: number;
  gastosFinancieros: number;
}

export const DebtAnalysisSection = ({
  deudaCorto,
  deudaLargo,
  activoTotal,
  ebitda,
  gastosFinancieros
}: DebtAnalysisSectionProps) => {
  const deudaTotal = deudaCorto + deudaLargo;
  const deudaActivoPercentage = (deudaTotal / activoTotal) * 100;
  const deudaEbitdaRatio = deudaTotal / ebitda;
  const coberturaIntereses = ebitda / gastosFinancieros;
  const deudaCortoPorcentaje = (deudaCorto / deudaTotal) * 100;

  // Datos para el gráfico de barras apiladas
  const stackedData = [
    {
      periodo: '2022',
      deudaCorto: deudaCorto * 0.8,
      deudaLargo: deudaLargo * 1.2
    },
    {
      periodo: '2023',
      deudaCorto: deudaCorto * 0.9,
      deudaLargo: deudaLargo * 1.1
    },
    {
      periodo: '2024',
      deudaCorto: deudaCorto,
      deudaLargo: deudaLargo
    }
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards de Deuda */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estructura de Endeudamiento</h3>
        <DebtKPICards
          deudaCorto={deudaCorto}
          deudaLargo={deudaLargo}
          deudaActivoPercentage={deudaActivoPercentage}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras Apiladas */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              Evolución de la Deuda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DebtStackedChart data={stackedData} />
          </CardContent>
        </Card>

        {/* Radar Chart de Ratios */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm">
                <Radar className="h-5 w-5 text-primary" />
              </div>
              Análisis de Ratios vs Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DebtRadarChart
              deudaEbitdaRatio={deudaEbitdaRatio}
              coberturaIntereses={coberturaIntereses}
              deudaCortoPorcentaje={deudaCortoPorcentaje}
            />
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Deuda/EBITDA:</span>
                <span className={deudaEbitdaRatio > 3 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {deudaEbitdaRatio.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cobertura Intereses:</span>
                <span className={coberturaIntereses < 2 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {coberturaIntereses.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deuda CP/Total:</span>
                <span className={deudaCortoPorcentaje > 30 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {deudaCortoPorcentaje.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};