
import { Settings, Search } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="h-16 bg-dashboard-bg border-b border-dashboard-border px-6 flex items-center justify-between">
      {/* Page Info */}
      <div>
        <h2 className="text-xl font-semibold text-dashboard-text">Dashboard</h2>
        <p className="text-sm text-dashboard-text-muted">Financial overview and analytics</p>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dashboard-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-dashboard-card border border-dashboard-border rounded-lg text-sm text-dashboard-text placeholder-dashboard-text-muted focus:outline-none focus:ring-2 focus:ring-dashboard-accent focus:border-transparent"
          />
        </div>
        
        {/* Settings */}
        <button className="p-2 rounded-lg bg-dashboard-card border border-dashboard-border hover:bg-dashboard-card-hover transition-colors">
          <Settings className="h-5 w-5 text-dashboard-text-secondary" />
        </button>
        
        {/* Date Info */}
        <div className="text-right">
          <p className="text-sm font-medium text-dashboard-text">D189810</p>
          <p className="text-xs text-dashboard-text-muted">Today</p>
        </div>
      </div>
    </header>
  );
};
