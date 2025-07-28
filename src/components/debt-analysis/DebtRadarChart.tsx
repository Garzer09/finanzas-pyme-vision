import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DebtRadarChartProps {
  deudaEbitdaRatio: number;
  coberturaIntereses: number;
  deudaCortoPorcentaje: number;
}

export const DebtRadarChart = ({ 
  deudaEbitdaRatio, 
  coberturaIntereses, 
  deudaCortoPorcentaje 
}: DebtRadarChartProps) => {
  // Normalizar valores para el radar (0-100 scale)
  const normalizeDebtEbitda = (value: number) => Math.max(0, Math.min(100, (5 - value) * 20)); // Inverso, 3x = 40%
  const normalizeCoverage = (value: number) => Math.min(100, value * 20); // 2x = 40%, 5x = 100%
  const normalizeShortDebt = (value: number) => Math.max(0, 100 - (value * 3.33)); // 30% = 0%, 0% = 100%

  const data = [
    {
      indicator: 'Deuda/EBITDA',
      empresa: normalizeDebtEbitda(deudaEbitdaRatio),
      benchmark: 40, // 3x EBITDA como benchmark
      fullMark: 100,
      actualValue: deudaEbitdaRatio,
      benchmarkValue: 3,
      unit: 'x',
      description: 'Menor es mejor (≤3x)'
    },
    {
      indicator: 'Cobertura Intereses',
      empresa: normalizeCoverage(coberturaIntereses),
      benchmark: 40, // 2x como mínimo
      fullMark: 100,
      actualValue: coberturaIntereses,
      benchmarkValue: 2,
      unit: 'x',
      description: 'Mayor es mejor (≥2x)'
    },
    {
      indicator: 'Deuda CP/Total',
      empresa: normalizeShortDebt(deudaCortoPorcentaje),
      benchmark: 70, // 30% como límite
      fullMark: 100,
      actualValue: deudaCortoPorcentaje,
      benchmarkValue: 30,
      unit: '%',
      description: 'Menor es mejor (≤30%)'
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 mb-2">{data.indicator}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Empresa:</span>
              <span className="font-medium">{data.actualValue.toFixed(1)}{data.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Benchmark:</span>
              <span className="font-medium">{data.benchmarkValue}{data.unit}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">{data.description}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid className="stroke-gray-200" />
          <PolarAngleAxis 
            dataKey="indicator" 
            className="text-xs fill-gray-600"
            tick={{ fontSize: 12 }}
          />
          <PolarRadiusAxis 
            domain={[0, 100]} 
            className="text-xs fill-gray-400"
            tick={{ fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted))"
            fillOpacity={0.2}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Radar
            name="Empresa"
            dataKey="empresa"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={3}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};