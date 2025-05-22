
import { BarChart3, Droplets, Shield, Zap, Calculator, Home } from 'lucide-react';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator';

interface ModuleNavigationProps {
  activeModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

export const ModuleNavigation = ({ activeModule, onModuleChange }: ModuleNavigationProps) => {
  const modules = [
    { id: 'overview', name: 'Panel Principal', icon: Home },
    { id: 'rentability', name: 'Rentabilidad', icon: BarChart3 },
    { id: 'liquidity', name: 'Liquidez', icon: Droplets },
    { id: 'solvency', name: 'Solvencia', icon: Shield },
    { id: 'efficiency', name: 'Eficiencia', icon: Zap },
    { id: 'simulator', name: 'Simulador', icon: Calculator },
  ];

  return (
    <div className="flex flex-wrap pb-3 border-b border-[#dce1e5]">
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
