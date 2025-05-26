
import { useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { KPICards } from '../components/KPICards';
import { FinancialSemaphore } from '../components/FinancialSemaphore';
import { ModuleNavigation } from '../components/ModuleNavigation';
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
          <div className="min-h-screen bg-gradient-dashboard">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              {/* Header Section */}
              <div className="mb-8 fade-in">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold text-white tracking-tight">Panel Principal</h1>
                  <p className="text-dashboard-text-secondary text-lg">Resumen financiero del año fiscal actual</p>
                </div>
              </div>
              
              {/* Financial Health Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-blue rounded-full"></div>
                  Salud Financiera
                </h2>
                <div className="glass-card glass-card-hover rounded-2xl p-6 border border-dashboard-border">
                  <FinancialSemaphore />
                </div>
              </div>
              
              {/* KPIs Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-success rounded-full"></div>
                  Indicadores Clave de Rendimiento
                </h2>
                <div className="glass-card glass-card-hover rounded-2xl p-6 border border-dashboard-border">
                  <KPICards />
                </div>
              </div>
              
              {/* Financial Trends Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-warning rounded-full"></div>
                  Tendencias Financieras
                </h2>
                <div className="glass-card glass-card-hover rounded-2xl p-6 border border-dashboard-border">
                  <MainCharts />
                </div>
              </div>
              
              {/* Alerts Section */}
              <div className="mb-8">
                <div className="glass-card glass-card-hover rounded-2xl p-6 border border-dashboard-border">
                  <AlertPanel />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard font-sans">
      <DashboardHeader />
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 flex flex-1 justify-center py-6">
        <div className="w-full max-w-[1400px]">
          {/* Navigation */}
          <div className="glass-card rounded-2xl p-4 border border-dashboard-border mb-8">
            <ModuleNavigation activeModule={activeModule} onModuleChange={setActiveModule} />
          </div>
          
          {/* Main Content */}
          <div className="fade-in">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
