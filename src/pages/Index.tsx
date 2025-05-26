
import { useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { KPICards } from '../components/KPICards';
import { FinancialSemaphore } from '../components/FinancialSemaphore';
import { MainCharts } from '../components/MainCharts';
import { AlertPanel } from '../components/AlertPanel';
import { RentabilityModule } from '../components/modules/RentabilityModule';
import { LiquidityModule } from '../components/modules/LiquidityModule';
import { SolvencyModule } from '../components/modules/SolvencyModule';
import { EfficiencyModule } from '../components/modules/EfficiencyModule';
import { SimulatorModule } from '../components/modules/SimulatorModule';
import { KeyFinancialAssumptionsModule } from '../components/modules/KeyFinancialAssumptionsModule';
import { FinancialAnalysisModule } from '../components/modules/FinancialAnalysisModule';
import { ProjectionsModule } from '../components/modules/ProjectionsModule';
import { SensitivityModule } from '../components/modules/SensitivityModule';
import { ValuationModule } from '../components/modules/ValuationModule';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator' | 'assumptions' | 'financial-analysis' | 'projections' | 'sensitivity' | 'valuation';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'rentability':
        return <RentabilityModule />;
      case 'liquidity':
        return <LiquidityModule />;
      case 'solvency':
        return <SolvencyModule />;
      case 'efficiency':
        return <EfficiencyModule />;
      case 'simulator':
        return <SimulatorModule />;
      case 'assumptions':
        return <KeyFinancialAssumptionsModule />;
      case 'financial-analysis':
        return <FinancialAnalysisModule />;
      case 'projections':
        return <ProjectionsModule />;
      case 'sensitivity':
        return <SensitivityModule />;
      case 'valuation':
        return <ValuationModule />;
      default:
        return (
          <div className="p-6 space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="dashboard-card dashboard-card-blue p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dashboard-text-secondary text-sm font-medium">Offers To Review</p>
                    <p className="text-3xl font-bold text-white metric-number">10</p>
                  </div>
                  <div className="w-12 h-12 bg-dashboard-accent rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📄</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card dashboard-card-blue p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dashboard-text-secondary text-sm font-medium">Deal Name</p>
                    <p className="text-2xl font-bold text-white">03</p>
                    <p className="text-dashboard-text-secondary text-xs">Company deal</p>
                  </div>
                  <div className="w-12 h-12 bg-dashboard-accent rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📋</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card dashboard-card-red p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dashboard-text-secondary text-sm font-medium">Pending Checks</p>
                    <p className="text-3xl font-bold text-white metric-number">06</p>
                  </div>
                  <div className="w-12 h-12 bg-dashboard-danger rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">⚠️</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card dashboard-card-green p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dashboard-text-secondary text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-white metric-number">$189,810</p>
                  </div>
                  <div className="w-12 h-12 bg-dashboard-success rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Main Chart */}
              <div className="xl:col-span-2">
                <div className="dashboard-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-dashboard-text">Audit Chart</h3>
                    <select className="bg-dashboard-card-hover border border-dashboard-border rounded-lg px-3 py-1 text-sm text-dashboard-text">
                      <option>Change period</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <MainCharts />
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-6">
                {/* Financial Health */}
                <div className="dashboard-card p-6">
                  <h3 className="text-lg font-semibold text-dashboard-text mb-4">Salud Financiera</h3>
                  <FinancialSemaphore />
                </div>

                {/* Alerts */}
                <div className="dashboard-card p-6">
                  <AlertPanel />
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coming Ratio */}
              <div className="dashboard-card p-6">
                <h3 className="text-lg font-semibold text-dashboard-text mb-6">Coming Ratio</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-dashboard-success flex items-center justify-center relative">
                      <span className="text-dashboard-success font-bold">T</span>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-dashboard-success rounded-full"></div>
                    </div>
                    <p className="text-xs text-dashboard-text-secondary">DEV</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-dashboard-success flex items-center justify-center relative">
                      <span className="text-dashboard-success font-bold">Z</span>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-dashboard-success rounded-full"></div>
                    </div>
                    <p className="text-xs text-dashboard-text-secondary">AXI</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full border-4 border-dashboard-text-muted flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">80%</span>
                    </div>
                    <p className="text-xs text-dashboard-text-secondary">DEV</p>
                  </div>
                </div>
              </div>

              {/* Demo Distribution */}
              <div className="dashboard-card p-6">
                <h3 className="text-lg font-semibold text-dashboard-text mb-6">Demo Distribution</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dashboard-text-secondary">Windows</span>
                    <span className="text-sm text-dashboard-text">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dashboard-text-secondary">MacOS</span>
                    <span className="text-sm text-dashboard-text">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-dashboard-text-secondary">Linux</span>
                    <span className="text-sm text-dashboard-text">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard font-sans flex">
      {/* Sidebar */}
      <DashboardSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto">
          <div className="fade-in">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
