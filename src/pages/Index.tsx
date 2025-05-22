
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

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator';

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
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <KPICards />
              </div>
              <div className="lg:col-span-1">
                <FinancialSemaphore />
              </div>
            </div>
            <MainCharts />
            <AlertPanel />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-6">
        <ModuleNavigation activeModule={activeModule} onModuleChange={setActiveModule} />
        <div className="mt-6">
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
};

export default Index;
