import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DebtKPICards } from './DebtKPICards';
import { DebtStackedChart } from './DebtStackedChart';
import { BarChart3, FileText } from 'lucide-react';

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

        {/* Diagnóstico y Análisis */}
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              Diagnóstico Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Análisis de Deuda/EBITDA */}
              <div className={`p-4 rounded-lg border-l-4 ${
                deudaEbitdaRatio <= 3 
                  ? 'bg-green-50 border-green-500' 
                  : deudaEbitdaRatio <= 4 
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-2">Ratio Deuda/EBITDA: {deudaEbitdaRatio.toFixed(1)}x</h4>
                <p className="text-sm text-gray-700">
                  {deudaEbitdaRatio <= 3 
                    ? '✅ Excelente. El nivel de endeudamiento es conservador y permite flexibilidad financiera.'
                    : deudaEbitdaRatio <= 4
                    ? '⚠️ Moderado. Se recomienda monitorear la evolución y considerar reducir deuda.'
                    : '🚨 Alto riesgo. Es prioritario implementar un plan de desapalancamiento.'}
                </p>
              </div>

              {/* Análisis de Cobertura de Intereses */}
              <div className={`p-4 rounded-lg border-l-4 ${
                coberturaIntereses >= 2.5 
                  ? 'bg-green-50 border-green-500' 
                  : coberturaIntereses >= 1.5 
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-2">Cobertura de Intereses: {coberturaIntereses.toFixed(1)}x</h4>
                <p className="text-sm text-gray-700">
                  {coberturaIntereses >= 2.5 
                    ? '✅ Sólida capacidad para cubrir gastos financieros con el EBITDA generado.'
                    : coberturaIntereses >= 1.5
                    ? '⚠️ Cobertura ajustada. Vigilar la evolución del EBITDA y carga financiera.'
                    : '🚨 Insuficiente. El EBITDA apenas cubre los gastos financieros, situación crítica.'}
                </p>
              </div>

              {/* Análisis de Estructura de Deuda */}
              <div className={`p-4 rounded-lg border-l-4 ${
                deudaCortoPorcentaje <= 30 
                  ? 'bg-green-50 border-green-500' 
                  : deudaCortoPorcentaje <= 50 
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <h4 className="font-semibold text-gray-900 mb-2">Deuda Corto Plazo: {deudaCortoPorcentaje.toFixed(1)}%</h4>
                <p className="text-sm text-gray-700">
                  {deudaCortoPorcentaje <= 30 
                    ? '✅ Estructura equilibrada con predominio de financiación a largo plazo.'
                    : deudaCortoPorcentaje <= 50
                    ? '⚠️ Proporción elevada de deuda a corto plazo. Evaluar refinanciación.'
                    : '🚨 Excesiva concentración en el corto plazo. Riesgo de liquidez significativo.'}
                </p>
              </div>

              {/* Recomendaciones */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Recomendaciones Estratégicas</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {deudaEbitdaRatio > 3 && (
                    <li>• Implementar plan de desapalancamiento progresivo</li>
                  )}
                  {coberturaIntereses < 2 && (
                    <li>• Optimizar estructura de costos para mejorar EBITDA</li>
                  )}
                  {deudaCortoPorcentaje > 30 && (
                    <li>• Negociar refinanciación hacia instrumentos de largo plazo</li>
                  )}
                  <li>• Establecer líneas de crédito para garantizar liquidez</li>
                  <li>• Monitorear mensualmente la evolución de estos ratios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};