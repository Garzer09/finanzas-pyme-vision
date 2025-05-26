
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

  const getStatusColor = (score: number) => {
    if (score >= 7) return { bg: 'from-emerald-500/30 to-teal-500/30', border: 'border-emerald-400/50', text: 'text-emerald-400', icon: CheckCircle };
    if (score >= 4) return { bg: 'from-yellow-500/30 to-orange-500/30', border: 'border-yellow-400/50', text: 'text-yellow-400', icon: AlertTriangle };
    return { bg: 'from-red-500/30 to-orange-500/30', border: 'border-red-400/50', text: 'text-red-400', icon: XCircle };
  };

  const statusStyle = getStatusColor(healthData.overallScore);
  const StatusIcon = statusStyle.icon;

  const indicators = [
    { label: 'Liquidez', value: healthData.liquidity, color: 'text-blue-400' },
    { label: 'Rentabilidad', value: healthData.profitability, color: 'text-emerald-400' },
    { label: 'Solvencia', value: healthData.solvency, color: 'text-orange-400' },
    { label: 'Eficiencia', value: healthData.efficiency, color: 'text-purple-400' }
  ];

  return (
    <Card className={`bg-gradient-to-br ${statusStyle.bg} backdrop-blur-sm border ${statusStyle.border} p-6 mb-6`} style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-white/10 border border-white/20">
              <StatusIcon className={`h-6 w-6 ${statusStyle.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Estado Financiero: {healthData.status}</h2>
              <p className="text-gray-300">Puntuación General: {healthData.overallScore}/10</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {indicators.map((indicator, index) => (
            <div key={index} className="text-center">
              <p className="text-sm text-gray-300 mb-1">{indicator.label}</p>
              <p className={`font-semibold ${indicator.color}`}>{indicator.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-400" />
          <span className="text-white font-medium">Tendencia Positiva</span>
        </div>
      </div>
    </Card>
  );
};
