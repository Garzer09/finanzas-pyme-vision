
import { TrendingUp } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-light-gray-border px-10 py-3 bg-white shadow-sm" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex items-center gap-4 text-steel-blue-dark">
        <div className="h-4 w-4">
          <TrendingUp className="h-full w-full text-steel-blue" />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">FinSight Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4 text-steel-blue">
        <span className="text-sm font-medium">Dashboard Financiero Integral</span>
      </div>
    </header>
  );
};
