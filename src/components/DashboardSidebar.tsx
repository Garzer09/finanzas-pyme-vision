
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronRight,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      path: '/',
      label: 'Panel Principal',
      icon: Home,
      color: 'text-teal-400'
    },
    {
      path: '/supuestos',
      label: 'Supuestos Clave',
      icon: Calculator,
      color: 'text-blue-400'
    },
    {
      path: '/analisis',
      label: 'Análisis Financiero',
      icon: BarChart3,
      color: 'text-indigo-400'
    },
    {
      path: '/proyecciones',
      label: 'Proyecciones',
      icon: PieChart,
      color: 'text-pink-400'
    },
    {
      path: '/escenarios',
      label: 'Análisis de Sensibilidad',
      icon: TrendingDown,
      color: 'text-orange-400'
    },
    {
      path: '/valoracion',
      label: 'Valoración',
      icon: DollarSign,
      color: 'text-green-400'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={cn(
      "h-screen bg-navy-800 border-r border-gray-700 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white text-lg">FinSight</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-700 rounded-md transition-colors text-white"
          aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                active
                  ? "bg-teal-500/20 border border-teal-500/30 text-teal-300"
                  : "hover:bg-gray-700 text-white hover:text-teal-400"
              )}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-colors flex-shrink-0",
                  active ? "text-teal-300" : "text-gray-300"
                )} 
              />
              {!collapsed && (
                <span className="font-medium text-sm truncate">
                  {item.label}
                </span>
              )}
              
              {/* Active indicator */}
              {active && (
                <div className="absolute right-2 w-2 h-2 bg-teal-400 rounded-full animate-pulse-glow" />
              )}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 border border-gray-600 rounded-md text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-gray-700 text-white",
            collapsed && "justify-center"
          )}
          aria-label="Configuración"
          title={collapsed ? 'Configuración' : undefined}
        >
          <Settings className="h-5 w-5 text-gray-300" />
          {!collapsed && (
            <span className="font-medium text-sm">Configuración</span>
          )}
        </button>
      </div>
    </div>
  );
};
