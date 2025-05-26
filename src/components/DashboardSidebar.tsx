
import { BarChart3, Droplets, Shield, Zap, Calculator, Home, Settings, FileText, TrendingUp, BarChart, PieChart, User, Bell } from 'lucide-react';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator' | 'assumptions' | 'financial-analysis' | 'projections' | 'sensitivity' | 'valuation';

interface DashboardSidebarProps {
  activeModule: ActiveModule;
  onModuleChange: (module: ActiveModule) => void;
}

export const DashboardSidebar = ({ activeModule, onModuleChange }: DashboardSidebarProps) => {
  const modules = [
    { id: 'overview', name: 'Dashboard', icon: Home },
    { id: 'financial-analysis', name: 'Summary', icon: FileText },
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
    <aside className="w-64 h-screen bg-dashboard-sidebar border-r border-dashboard-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-blue rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dashboard-text">FinSight</h1>
            <p className="text-xs text-dashboard-text-muted">Financial Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id as ActiveModule)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 sidebar-nav-item ${
                activeModule === module.id ? 'active' : ''
              }`}
            >
              <module.icon className="h-5 w-5" />
              <span>{module.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dashboard-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-dashboard-card">
          <div className="w-8 h-8 bg-gradient-blue rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-dashboard-text">James Smith</p>
            <p className="text-xs text-dashboard-text-muted">Admin</p>
          </div>
          <button className="p-1 rounded-lg hover:bg-dashboard-card-hover transition-colors">
            <Bell className="h-4 w-4 text-dashboard-text-secondary" />
          </button>
        </div>
      </div>
    </aside>
  );
};
