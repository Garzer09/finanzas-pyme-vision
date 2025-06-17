
import { Card } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const CompanyHealthStatus = () => {
  // Simulamos datos del estado financiero
  const healthData = {
    overallScore: 7.5, // De 0 a 10
    liquidity: 'Buena',
    profitability: 'Excelente',
    solvency: 'Moderada',
    efficiency: 'Buena',
    status: 'Saludable'
  };

  const getStatusIcon = (score: number) => {
    if (score >= 7) return CheckCircle;
    if (score >= 4) return AlertTriangle;
    return XCircle;
  };

  const getStatusColor = (score: number) => {
    if (score >= 7) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' };
    if (score >= 4) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' };
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' };
  };

  const statusStyle = getStatusColor(healthData.overallScore);
  const StatusIcon = getStatusIcon(healthData.overallScore);

  const indicators = [
    { label: 'Liquidez', value: healthData.liquidity, color: 'text-steel-blue' },
    { label: 'Rentabilidad', value: healthData.profitability, color: 'text-steel-blue-dark' },
    { label: 'Solvencia', value: healthData.solvency, color: 'text-steel-blue' },
    { label: 'Eficiencia', value: healthData.efficiency, color: 'text-steel-blue-dark' }
  ];

  return (
    <Card className={`${statusStyle.bg} border ${statusStyle.border} p-6 mb-6 shadow-sm`} style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-white border border-steel-blue/20 shadow-sm">
              <StatusIcon className={`h-6 w-6 ${statusStyle.icon}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusStyle.text}`}>Estado Financiero: {healthData.status}</h2>
              <p className="text-gray-700">Puntuación General: {healthData.overallScore}/10</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {indicators.map((indicator, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-gray-600 mb-1">{indicator.label}</p>
              <p className={`font-semibold ${indicator.color}`}>{indicator.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-steel-blue" />
          <span className="text-gray-900 font-medium">Tendencia Positiva</span>
        </div>
      </div>
    </Card>
  );
};
