
import { TrendingUp, Calendar, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DashboardHeader = () => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Financiero</h1>
                <p className="text-sm text-slate-600">PYME Integral - Análisis en Tiempo Real</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <p className="text-slate-600">Último actualización</p>
              <p className="font-semibold text-slate-800">23 Mayo 2025 - 14:30</p>
            </div>
            <Button variant="outline" size="sm" className="space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Período</span>
            </Button>
            <Button variant="outline" size="sm" className="space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
