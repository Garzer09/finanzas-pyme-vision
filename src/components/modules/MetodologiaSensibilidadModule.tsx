
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardPageHeader } from '@/components/DashboardPageHeader';
import { InsightsPanel } from '@/components/segments/InsightsPanel';
import { SensitivityKPICards } from '@/components/sensitivity/SensitivityKPICards';
import { VariableSimulator } from '@/components/sensitivity/VariableSimulator';
import { ScenarioAnalysis } from '@/components/sensitivity/ScenarioAnalysis';
import { TornadoChart } from '@/components/sensitivity/TornadoChart';
import { SensitivityToolbar } from '@/components/sensitivity/SensitivityToolbar';
import { useSensitivity } from '@/hooks/useSensitivity';
import { useSensitivityInsights } from '@/hooks/useSensitivityInsights';
import { useToast } from '@/hooks/use-toast';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMemo } from 'react';

export const MetodologiaSensibilidadModule = () => {
  const { toast } = useToast();
  
  // Datos reales para EBITDA base (proxy con resultado_explotacion si no hay EBITDA)
  const { data, loading } = useFinancialData('estado_pyg');
  const baseEbitdaK = useMemo(() => {
    if (!data || data.length === 0) return 450;
    const items = data.filter(d => d.data_type === 'estado_pyg');
    if (items.length === 0) return 450;
    const latest = [...items].sort((a, b) => new Date(b.period_date).getTime() - new Date(a.period_date).getTime())[0];
    const content = latest?.data_content || {};
    const ebitda = Number(content['ebitda']);
    const ebitProxy = Number(content['resultado_explotacion']);
    const val = isFinite(ebitda) && ebitda !== 0 ? ebitda : (isFinite(ebitProxy) ? ebitProxy : 450000);
    return Math.max(1, Math.round(val / 1000)); // convertir a K€
  }, [data]);

  // Use sensitivity hook con EBITDA base real
  const {
    sensitivityData,
    handleSalesChange,
    handleCostsChange,
    setSalesDelta,
    setCostsDelta
  } = useSensitivity(baseEbitdaK);

  // Get AI insights
  const { insights, isLoading } = useSensitivityInsights(sensitivityData);

  // Export handlers
  const handleExportPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Se está generando el reporte de análisis de sensibilidad..."
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "Descargando CSV",
      description: "Los datos del análisis se están descargando..."
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col relative">
        <DashboardHeader />
        
        {/* Sticky Toolbar */}
        <SensitivityToolbar />
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6 pb-0">
            <DashboardPageHeader
              title="Metodología de Análisis de Sensibilidad"
              subtitle="Análisis del impacto de variables clave en los resultados financieros"
            />
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-8">
              {/* KPI Cards Grid */}
              <section>
                <SensitivityKPICards sensitivityData={sensitivityData} />
              </section>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Analysis Area */}
                <div className="xl:col-span-3 space-y-8">
                  {/* Variable Simulator and Scenario Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <VariableSimulator
                      sensitivityData={sensitivityData}
                      onSalesChange={handleSalesChange}
                      onCostsChange={handleCostsChange}
                      onSalesDirectChange={setSalesDelta}
                      onCostsDirectChange={setCostsDelta}
                    />
                    <ScenarioAnalysis />
                  </div>

                  {/* Tornado Chart */}
                  <TornadoChart />
                </div>

                {/* Insights Sidebar */}
                <div className="xl:col-span-1">
                  <InsightsPanel
                    insights={insights}
                    isLoading={isLoading}
                    onExportPDF={handleExportPDF}
                    onExportCSV={handleExportCSV}
                    className="sticky top-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

