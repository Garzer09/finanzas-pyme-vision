
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface VencimientoItem {
  entidad: string;
  fecha: string;
  cuota: number;
  tipo: string;
  urgencia: 'alta' | 'media' | 'baja';
}

interface DebtPoolTimelineProps {
  vencimientos: VencimientoItem[];
}

export const DebtPoolTimeline = ({ vencimientos }: DebtPoolTimelineProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'text-red-400 bg-red-500/20';
      case 'media': return 'text-yellow-400 bg-yellow-500/20';
      case 'baja': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Calendario de Vencimientos</h2>
      
      <div className="space-y-4">
        {vencimientos.map((venc, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-600">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${getUrgencyColor(venc.urgencia)}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-white font-medium">{venc.entidad}</p>
                <p className="text-gray-400 text-sm">{venc.tipo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{formatCurrency(venc.cuota)}</p>
              <p className="text-gray-400 text-sm">{venc.fecha}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
