
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardPageHeader } from '@/components/DashboardPageHeader';
import { ValuationKPIs } from '@/components/valuation/ValuationKPIs';
import { MethodsWeightPanel } from '@/components/valuation/MethodsWeightPanel';
import { ValuationMethodsChart } from '@/components/valuation/ValuationMethodsChart';
import { HorizonSelector } from '@/components/valuation/HorizonSelector';
import { useValuation } from '@/hooks/useValuation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Save, FileDown, Share2, AlertTriangle } from 'lucide-react';

export const EVAValuationModule = () => {
  const { toast } = useToast();
  const {
    valuationData,
    updateMethodWeights,
    updateGrowthRate,
    updateHorizon
  } = useValuation(); // TODO: Pass companyId when available

  const hasMinYears = (valuationData.financialData.revenue?.length || 0) >= 3;

  const handleSaveValuation = () => {
    toast({
      title: "Valoración Guardada",
      description: "La valoración ha sido guardada exitosamente."
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Se está generando el informe de valoración..."
    });
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Enlace Copiado",
      description: "El enlace a la valoración ha sido copiado al portapapeles."
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col relative">
        <DashboardHeader />
        
        {/* Sticky Toolbar */}
        <div className="fixed top-20 right-6 z-40 bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl shadow-xl p-3">
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveValuation}
              variant="default"
              size="sm"
              className="gap-2 justify-start"
              aria-label="Guardar valoración"
              disabled={!hasMinYears}
            >
              <Save className="h-4 w-4" />
              <span className="hidden lg:inline">Guardar</span>
            </Button>
            
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="gap-2 justify-start"
              aria-label="Exportar valoración en PDF"
              disabled={!hasMinYears}
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden lg:inline">PDF</span>
            </Button>
            
            <Button
              onClick={handleShareLink}
              variant="outline"
              size="sm"
              className="gap-2 justify-start"
              aria-label="Compartir enlace de valoración"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden lg:inline">Compartir</span>
            </Button>
          </div>
        </div>
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6 pb-0">
            <DashboardPageHeader
              title="Valoración EVA"
              subtitle="Análisis integral con múltiples metodologías de valoración"
            />
            {!hasMinYears && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-300/70 bg-yellow-50 p-3 text-yellow-800">
                <AlertTriangle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-medium">Histórico insuficiente</p>
                  <p className="text-sm">Se requieren al menos 3 años de datos financieros para calcular la valoración (DCF y métodos relacionados).</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-8">
              {/* KPI Cards */}
              <section>
                <ValuationKPIs valuationData={valuationData} />
              </section>

              {/* Horizon Configuration */}
              <section>
                <HorizonSelector
                  valuationData={valuationData}
                  onHorizonChange={updateHorizon}
                />
              </section>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Methods Weight Panel */}
                <MethodsWeightPanel
                  valuationData={valuationData}
                  onWeightsChange={updateMethodWeights}
                />

                {/* Valuation Methods Chart */}
                <ValuationMethodsChart
                  valuationData={valuationData}
                  onGrowthRateUpdate={updateGrowthRate}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
