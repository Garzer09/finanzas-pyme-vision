
import { BarChart3, Droplets, Shield, Zap, Calculator, Home, Settings, FileText, TrendingUp, BarChart, PieChart } from 'lucide-react';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator' | 'assumptions' | 'financial-analysis' | 'projections' | 'sensitivity' | 'valuation';

interface ModuleNavigationProps {
  activeModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

export const ModuleNavigation = ({ activeModule, onModuleChange }: ModuleNavigationProps) => {
  const modules = [
    { id: 'overview', name: 'Panel Principal', icon: Home },
    { id: 'financial-analysis', name: 'Análisis Financiero', icon: FileText },
    { id: 'rentability', name: 'Rentabilidad', icon: BarChart3 },
    { id: 'liquidity', name: 'Liquidez', icon: Droplets },
    { id: 'solvency', name: 'Solvencia', icon: Shield },
    { id: 'efficiency', name: 'Eficiencia', icon: Zap },
    { id: 'assumptions', name: 'Supuestos', icon: Settings },
    { id: 'projections', name: 'Proyecciones', icon: TrendingUp },
    { id: 'sensitivity', name: 'Escenarios', icon: BarChart },
    { id: 'valuation', name: 'EVA', icon: PieChart },
    { id: 'simulator', name: 'Simulador', icon: Calculator },
  ];

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto">
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => onModuleChange(module.id as ActiveModule)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeModule === module.id 
              ? 'bg-gradient-blue text-white shadow-glow' 
              : 'text-dashboard-text-secondary hover:text-white hover:bg-dashboard-card'
          }`}
        >
          <module.icon className="h-4 w-4" />
          <span>{module.name}</span>
        </button>
      ))}
    </div>
  );
};
