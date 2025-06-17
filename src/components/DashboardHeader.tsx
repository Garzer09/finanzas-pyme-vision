
import { TrendingUp } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200/50 px-10 py-4 bg-white/95 backdrop-blur-xl shadow-sm" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Next Consultor-IA</h1>
          <p className="text-sm text-gray-600 font-medium">Dashboard Financiero Integral</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-xl border border-indigo-200 backdrop-blur-sm">
          Análisis Profesional con IA
        </span>
      </div>
    </header>
  );
};
