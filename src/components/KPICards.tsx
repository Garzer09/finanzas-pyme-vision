
import { Card } from '@/components/ui/card';

export const KPICards = () => {
  const kpis = [
    {
      title: 'VENTAS',
      value: '€2.5M',
      change: '+12%',
      trend: 'up',
      subtitle: 'YoY',
    },
    {
      title: 'EBITDA',
      value: '€450K',
      change: '-5%',
      trend: 'down',
      subtitle: 'YoY',
    },
    {
      title: 'TESORERÍA',
      value: '€125K',
      change: '15 días',
      trend: 'neutral',
      subtitle: 'de operación',
    },
    {
      title: 'DEUDA NETA',
      value: '€800K',
      change: '2.1x',
      trend: 'neutral',
      subtitle: 'EBITDA',
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#dce1e5]">
          <p className="text-[#111518] text-base font-medium leading-normal">{kpi.title}</p>
          <p className="text-[#111518] tracking-light text-2xl font-bold leading-tight">{kpi.value}</p>
          <p className={`text-base font-medium leading-normal ${
            kpi.trend === 'up' 
              ? 'text-[#078838]' 
              : kpi.trend === 'down' 
              ? 'text-[#e73508]'
              : 'text-[#637988]'
          }`}>{kpi.change}</p>
        </div>
      ))}
    </div>
  );
};
