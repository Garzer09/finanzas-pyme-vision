
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Droplets, 
  Shield, 
  Zap, 
  Calculator,
  Settings,
  BarChart3,
  PieChart,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator' | 'assumptions' | 'financial-analysis' | 'projections' | 'sensitivity' | 'valuation';

interface DashboardSidebarProps {
  activeModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

export const DashboardSidebar = ({ activeModule, onModuleChange }: DashboardSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      id: 'overview' as ActiveModule,
      label: 'Panel Principal',
      icon: LayoutDashboard,
      color: 'text-teal-400'
    },
    {
      id: 'rentability' as ActiveModule,
      label: 'Rentabilidad',
      icon: TrendingUp,
      color: 'text-emerald-400'
    },
    {
      id: 'liquidity' as ActiveModule,
      label: 'Liquidez',
      icon: Droplets,
      color: 'text-blue-400'
    },
    {
      id: 'solvency' as ActiveModule,
      label: 'Solvencia',
      icon: Shield,
      color: 'text-purple-400'
    },
    {
      id: 'efficiency' as ActiveModule,
      label: 'Eficiencia',
      icon: Zap,
      color: 'text-yellow-400'
    },
    {
      id: 'simulator' as ActiveModule,
      label: 'Simulador',
      icon: Calculator,
      color: 'text-coral-400'
    },
    {
      id: 'financial-analysis' as ActiveModule,
      label: 'Análisis Financiero',
      icon: BarChart3,
      color: 'text-indigo-400'
    },
    {
      id: 'projections' as ActiveModule,
      label: 'Proyecciones',
      icon: PieChart,
      color: 'text-pink-400'
    },
    {
      id: 'sensitivity' as ActiveModule,
      label: 'Análisis de Sensibilidad',
      icon: TrendingDown,
      color: 'text-orange-400'
    },
    {
      id: 'valuation' as ActiveModule,
      label: 'Valoración',
      icon: DollarSign,
      color: 'text-green-400'
    }
  ];

  return (
    <div className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-sidebar-foreground text-lg">FinSight</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-sidebar-accent rounded-md transition-colors"
          aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-teal-500/20 border border-teal-500/30 text-teal-400"
                  : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-teal-400"
              )}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-teal-400" : item.color
                )} 
              />
              {!collapsed && (
                <span className="font-medium text-sm truncate">
                  {item.label}
                </span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-teal-400 rounded-full animate-pulse-glow" />
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground",
            collapsed && "justify-center"
          )}
          aria-label="Configuración"
          title={collapsed ? 'Configuración' : undefined}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && (
            <span className="font-medium text-sm">Configuración</span>
          )}
        </button>
      </div>
    </div>
  );
};
