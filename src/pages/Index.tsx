
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
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1 mx-auto">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-[#111518] tracking-light text-[32px] font-bold leading-tight">Panel Principal</p>
                <p className="text-[#637988] text-sm font-normal leading-normal">Resumen financiero del año fiscal actual</p>
              </div>
            </div>
            
            <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Salud Financiera</h2>
            <div className="p-4">
              <FinancialSemaphore />
            </div>
            
            <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Indicadores Clave de Rendimiento (KPIs)</h2>
            <div className="p-4">
              <KPICards />
            </div>
            
            <h2 className="text-[#111518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Tendencias Financieras</h2>
            <div className="px-4">
              <MainCharts />
            </div>
            
            <div className="px-4">
              <AlertPanel />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <DashboardHeader />
      <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
        <div className="w-full max-w-[1200px]">
          <ModuleNavigation activeModule={activeModule} onModuleChange={setActiveModule} />
          <div className="mt-6">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
