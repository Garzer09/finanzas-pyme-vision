
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
          <div className="min-h-screen bg-gradient-to-br from-dashboard-green-50 via-white to-dashboard-orange-50">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1 mx-auto">
              <div className="flex flex-wrap justify-between gap-3 p-6">
                <div className="flex min-w-72 flex-col gap-3">
                  <p className="text-dashboard-green-600 tracking-light text-[32px] font-bold leading-tight">Panel Principal</p>
                  <p className="text-dashboard-green-500 text-sm font-normal leading-normal">Resumen financiero del año fiscal actual</p>
                </div>
              </div>
              
              <h2 className="text-dashboard-green-600 text-[22px] font-bold leading-tight tracking-[-0.015em] px-6 pb-3 pt-5">Salud Financiera</h2>
              <div className="px-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-dashboard-green-100">
                  <FinancialSemaphore />
                </div>
              </div>
              
              <h2 className="text-dashboard-green-600 text-[22px] font-bold leading-tight tracking-[-0.015em] px-6 pb-3 pt-8">Indicadores Clave de Rendimiento (KPIs)</h2>
              <div className="px-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-dashboard-green-100">
                  <KPICards />
                </div>
              </div>
              
              <h2 className="text-dashboard-green-600 text-[22px] font-bold leading-tight tracking-[-0.015em] px-6 pb-3 pt-8">Tendencias Financieras</h2>
              <div className="px-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-dashboard-green-100">
                  <MainCharts />
                </div>
              </div>
              
              <div className="px-6 pt-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-dashboard-green-100">
                  <AlertPanel />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dashboard-green-50 via-white to-dashboard-orange-50" style={{ fontFamily: 'Inter, Noto Sans, sans-serif' }}>
      <DashboardHeader />
      <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
        <div className="w-full max-w-[1200px]">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-dashboard-green-100">
            <ModuleNavigation activeModule={activeModule} onModuleChange={setActiveModule} />
          </div>
          <div className="mt-6">
            {renderActiveModule()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
