
import { BarChart3, Droplets, Shield, Zap, Calculator, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
      {modules.map((module) => (
        <Button
          key={module.id}
          variant={activeModule === module.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModuleChange(module.id as ActiveModule)}
          className={`space-x-2 ${
            activeModule === module.id 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
          }`}
        >
          <module.icon className="h-4 w-4" />
          <span>{module.name}</span>
        </Button>
      ))}
    </div>
  );
};
