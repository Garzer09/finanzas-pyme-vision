
import { Card } from '@/components/ui/card';

export const KPICards = () => {
  const kpis = [
    {
      title: 'VENTAS',
      value: '€2.5M',
      change: '+12%',
      trend: 'up',
      subtitle: 'YoY',
      bgColor: 'bg-steel-blue-light',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'EBITDA',
      value: '€450K',
      change: '-5%',
      trend: 'down',
      subtitle: 'YoY',
      bgColor: 'bg-light-gray-100',
      borderColor: 'border-light-gray-200'
    },
    {
      title: 'TESORERÍA',
      value: '€125K',
      change: '15 días',
      trend: 'neutral',
      subtitle: 'de operación',
      bgColor: 'bg-steel-blue-light',
      borderColor: 'border-steel-blue/30'
    },
    {
      title: 'DEUDA NETA',
      value: '€800K',
      change: '2.1x',
      trend: 'neutral',
      subtitle: 'EBITDA',
      bgColor: 'bg-light-gray-100',
      borderColor: 'border-light-gray-200'
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className={`flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border ${kpi.borderColor} ${kpi.bgColor} hover:border-steel-blue hover:shadow-lg transition-all duration-300`}>
          <p className="text-gray-900 text-base font-semibold leading-normal">{kpi.title}</p>
          <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight">{kpi.value}</p>
          <p className={`text-base font-semibold leading-normal ${
            kpi.trend === 'up' 
              ? 'text-green-700' 
              : kpi.trend === 'down' 
              ? 'text-red-600'
              : 'text-gray-600'
          }`}>{kpi.change}</p>
          <p className="text-gray-600 text-sm font-medium">{kpi.subtitle}</p>
        </div>
      ))}
    </div>
  );
};
