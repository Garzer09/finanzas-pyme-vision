
import { useState, useEffect } from 'react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { KPICardsAnimated } from '../components/KPICardsAnimated';
import { GlobalFilters } from '../components/GlobalFilters';
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
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle } from 'lucide-react';

type ActiveModule = 'overview' | 'rentability' | 'liquidity' | 'solvency' | 'efficiency' | 'simulator' | 'assumptions' | 'financial-analysis' | 'projections' | 'sensitivity' | 'valuation';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detectar preferencia de movimiento reducido del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
          <div className="space-y-6">
            {/* Video de fondo con overlay */}
            <div className={`fixed inset-0 z-0 ${reducedMotion ? '' : 'data-wave-bg'}`}>
              <div className="absolute inset-0 bg-navy-800/90 z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-navy-800/50 via-teal-500/5 to-coral-500/5 z-20" />
            </div>

            {/* Contenido principal */}
            <div className="relative z-30 space-y-6">
              {/* Header con KPI Cards */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-h1 font-bold text-foreground mb-2">
                      Panel de Control Financiero
                    </h1>
                    <p className="text-body text-muted-foreground">
                      Resumen ejecutivo de la salud financiera empresarial
                    </p>
                  </div>
                  
                  {/* Botón de reducción de movimiento */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className="bg-card/50 hover:bg-card/70 border-border/50"
                    aria-label={reducedMotion ? 'Activar animaciones' : 'Reducir movimiento'}
                  >
                    {reducedMotion ? (
                      <PlayCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <PauseCircle className="h-4 w-4 mr-2" />
                    )}
                    {reducedMotion ? 'Activar' : 'Reducir'} movimiento
                  </Button>
                </div>
                
                <KPICardsAnimated />
              </div>

              {/* Filtros Globales */}
              <GlobalFilters />

              {/* Grid de contenido principal */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Sección Salud Financiera - 8 columnas */}
                <div className="xl:col-span-8 space-y-6">
                  <div>
                    <h2 className="text-h2 font-semibold text-foreground mb-4 flex items-center gap-2">
                      📊 Salud Financiera
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="chart-container">
                        <FinancialSemaphore />
                      </div>
                      <div className="chart-container">
                        <MainCharts />
                      </div>
                    </div>
                  </div>

                  {/* Sección Proyecciones */}
                  <div>
                    <h2 className="text-h2 font-semibold text-foreground mb-4 flex items-center gap-2">
                      🔮 Proyección 12 Meses
                    </h2>
                    <div className="chart-container">
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <h3 className="text-lg font-medium mb-2">Forecast Prophet - Ingresos</h3>
                          <p className="text-sm">Proyección automática basada en datos históricos</p>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-teal-400">€2.8M</div>
                              <div className="text-xs text-muted-foreground">Proyección Q1</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-400">€3.2M</div>
                              <div className="text-xs text-muted-foreground">Proyección Q2</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-coral-400">75%</div>
                              <div className="text-xs text-muted-foreground">Progreso Objetivo</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel de Insights - 4 columnas */}
                <div className="xl:col-span-4">
                  <h2 className="text-h2 font-semibold text-foreground mb-4 flex items-center gap-2">
                    💡 Insights Automáticos
                  </h2>
                  <div className="insight-panel space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-3">Insights Clave</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-card/30 rounded-lg border border-border/30">
                          <p className="text-sm text-foreground">
                            🔥 Liquidez superó objetivo en 18% este trimestre
                          </p>
                        </div>
                        <div className="p-3 bg-card/30 rounded-lg border border-border/30">
                          <p className="text-sm text-foreground">
                            📈 Rentabilidad neta creció 3.2% vs periodo anterior
                          </p>
                        </div>
                        <div className="p-3 bg-card/30 rounded-lg border border-border/30">
                          <p className="text-sm text-foreground">
                            ⚡ Ratio D/E mejoró significativamente (-25%)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-3">Riesgo Principal</h3>
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-sm text-red-300">
                          ⚠️ Concentración en segmento retail (65% ingresos)
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-3">Oportunidad</h3>
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-sm text-emerald-300">
                          🚀 Expansión digital puede incrementar margen 12%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel de Alertas */}
                  <div className="mt-6">
                    <AlertPanel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-navy-800 text-foreground font-inter ${reducedMotion ? 'reduced-motion' : ''}`}>
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          activeModule={activeModule} 
          onModuleChange={setActiveModule} 
        />
        
        {/* Contenido principal */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
