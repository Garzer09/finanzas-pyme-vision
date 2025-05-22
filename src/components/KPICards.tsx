
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const KPICards = () => {
  const kpis = [
    {
      title: 'VENTAS',
      value: '€2.5M',
      change: '+12%',
      trend: 'up',
      subtitle: 'YoY',
      icon: DollarSign,
    },
    {
      title: 'EBITDA',
      value: '€450K',
      change: '-5%',
      trend: 'down',
      subtitle: 'YoY',
      icon: TrendingUp,
    },
    {
      title: 'TESORERÍA',
      value: '€125K',
      change: '15 días',
      trend: 'neutral',
      subtitle: 'de operación',
      icon: CreditCard,
    },
    {
      title: 'DEUDA NETA',
      value: '€800K',
      change: '2.1x',
      trend: 'neutral',
      subtitle: 'EBITDA',
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <kpi.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                kpi.trend === 'up' 
                  ? 'bg-green-100 text-green-700' 
                  : kpi.trend === 'down' 
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {kpi.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {kpi.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                <span>{kpi.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-slate-800 mb-1">{kpi.value}</p>
              <p className="text-xs text-slate-500">{kpi.subtitle}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
