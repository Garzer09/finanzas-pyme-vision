
import { TrendingUp, Bell, User, Settings } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="glass-card border-b border-dashboard-border px-6 lg:px-12 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-blue rounded-xl flex items-center justify-center glow-blue">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">FinSight</h1>
            <p className="text-dashboard-text-secondary text-sm">Financial Dashboard</p>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-8">
          <nav className="flex items-center gap-6">
            <a className="text-dashboard-text-secondary hover:text-white text-sm font-medium transition-colors duration-200" href="#">Panel Principal</a>
            <a className="text-dashboard-text-secondary hover:text-white text-sm font-medium transition-colors duration-200" href="#">Análisis</a>
            <a className="text-dashboard-text-secondary hover:text-white text-sm font-medium transition-colors duration-200" href="#">Proyecciones</a>
            <a className="text-dashboard-text-secondary hover:text-white text-sm font-medium transition-colors duration-200" href="#">Simulador</a>
          </nav>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button className="glass-card-hover w-10 h-10 rounded-xl border border-dashboard-border flex items-center justify-center transition-all duration-200 hover:glow-blue">
            <Bell className="h-5 w-5 text-dashboard-text-secondary hover:text-white" />
          </button>
          <button className="glass-card-hover w-10 h-10 rounded-xl border border-dashboard-border flex items-center justify-center transition-all duration-200 hover:glow-blue">
            <Settings className="h-5 w-5 text-dashboard-text-secondary hover:text-white" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-blue flex items-center justify-center glow-blue">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
