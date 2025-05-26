
import { Card } from '@/components/ui/card';
import { CreditCard, TrendingUp, Calendar } from 'lucide-react';

interface DebtPoolKPIsProps {
  totalCapitalPendiente: number;
  tipoInteresPromedio: number;
  totalCuotasMensuales: number;
  debtItemsCount: number;
}

export const DebtPoolKPIs = ({ 
  totalCapitalPendiente, 
  tipoInteresPromedio, 
  totalCuotasMensuales, 
  debtItemsCount 
}: DebtPoolKPIsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-red-500/30 to-pink-500/30 backdrop-blur-sm border border-red-400/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/10 border border-white/20">
            <CreditCard className="h-5 w-5 text-red-400" />
          </div>
          <h3 className="font-semibold text-white">Capital Pendiente Total</h3>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCapitalPendiente)}</p>
          <p className="text-sm text-gray-300">{debtItemsCount} instrumentos</p>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 backdrop-blur-sm border border-blue-400/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/10 border border-white/20">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">Tipo Interés Promedio</h3>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-white">{tipoInteresPromedio.toFixed(2)}%</p>
          <p className="text-sm text-gray-300">ponderado por capital</p>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 backdrop-blur-sm border border-orange-400/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/10 border border-white/20">
            <Calendar className="h-5 w-5 text-orange-400" />
          </div>
          <h3 className="font-semibold text-white">Cuotas Mensuales</h3>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCuotasMensuales)}</p>
          <p className="text-sm text-gray-300">compromisos regulares</p>
        </div>
      </Card>
    </div>
  );
};
