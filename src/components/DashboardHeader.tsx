
import { TrendingUp } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-700 px-10 py-3 bg-navy-800" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex items-center gap-4 text-white">
        <div className="h-4 w-4">
          <TrendingUp className="h-full w-full text-teal-400" />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">FinSight Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4 text-white">
        <span className="text-sm">Dashboard Financiero Integral</span>
      </div>
    </header>
  );
};
