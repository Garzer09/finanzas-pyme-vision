
import { BarChart3, Droplets, Shield, Zap, Calculator, Home, Settings, FileText, TrendingUp, BarChart, PieChart, Lightbulb } from 'lucide-react';

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
    <div className="flex flex-wrap pb-3 border-b border-[#dce1e5] overflow-x-auto">
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => onModuleChange(module.id as ActiveModule)}
          className={`flex flex-col items-center justify-center pb-[13px] pt-4 px-8 ${
            activeModule === module.id 
              ? 'border-b-[3px] border-b-[#111518] text-[#111518]' 
              : 'border-b-[3px] border-b-transparent text-[#637988]'
          }`}
        >
          <p className={`text-sm font-bold leading-normal tracking-[0.015em] flex items-center gap-2`}>
            <module.icon className="h-4 w-4" />
            <span>{module.name}</span>
          </p>
        </button>
      ))}
    </div>
  );
};
