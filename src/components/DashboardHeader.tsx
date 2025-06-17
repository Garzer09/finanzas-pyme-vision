
import { TrendingUp } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 px-10 py-4 bg-white shadow-sm" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Next Consultor-IA</h1>
          <p className="text-sm text-gray-600">Dashboard Financiero Integral</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          Análisis Profesional con IA
        </span>
      </div>
    </header>
  );
};
