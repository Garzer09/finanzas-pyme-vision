
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import { KeyFinancialAssumptionsModule } from "./components/modules/KeyFinancialAssumptionsModule";
import { FinancialAnalysisModule } from "./components/modules/FinancialAnalysisModule";
import { ProjectionsModule } from "./components/modules/ProjectionsModule";
import { SensitivityModule } from "./components/modules/SensitivityModule";
import { ValuationModule } from "./components/modules/ValuationModule";
import { SituacionActualModule } from "./components/modules/SituacionActualModule";
import { SimulatorModule } from "./components/modules/SimulatorModule";
import { PremisasIngresosModule } from "./components/modules/PremisasIngresosModule";
import { MetodologiaSensibilidadModule } from "./components/modules/MetodologiaSensibilidadModule";
import { ProfitLossCurrentModule } from "./components/modules/ProfitLossCurrentModule";
import { BalanceSheetCurrentModule } from "./components/modules/BalanceSheetCurrentModule";
import { FinancialRatiosCurrentModule } from "./components/modules/FinancialRatiosCurrentModule";
import { CompanyDescriptionModule } from "./components/modules/CompanyDescriptionModule";

const queryClient = new QueryClient();

const App = () => (
  <div className="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/subir-excel" element={<ExcelUploadPage />} />
            <Route path="/suscripcion" element={<SubscriptionPage />} />
            <Route path="/descripcion-empresa" element={<CompanyDescriptionModule />} />
            
            {/* Sección 3 - Situación Actual */}
            <Route path="/situacion-actual" element={<SituacionActualModule />} />
            <Route path="/pyg-actual" element={<ProfitLossCurrentModule />} />
            <Route path="/pyg-analitico-actual" element={<FinancialAnalysisModule />} />
            <Route path="/balance-actual" element={<BalanceSheetCurrentModule />} />
            <Route path="/flujos-actual" element={<FinancialAnalysisModule />} />
            <Route path="/ratios-actual" element={<FinancialRatiosCurrentModule />} />
            <Route path="/punto-muerto-actual" element={<FinancialAnalysisModule />} />
            <Route path="/endeudamiento-actual" element={<FinancialAnalysisModule />} />
            <Route path="/servicio-deuda-actual" element={<FinancialAnalysisModule />} />
            <Route path="/tesoreria-actual" element={<FinancialAnalysisModule />} />
            <Route path="/nof-actual" element={<FinancialAnalysisModule />} />
            <Route path="/segmentos-actual" element={<FinancialAnalysisModule />} />
            
            {/* Sección 4 - Supuestos */}
            <Route path="/premisas-ingresos" element={<PremisasIngresosModule />} />
            <Route path="/estructura-costes" element={<KeyFinancialAssumptionsModule />} />
            <Route path="/capital-trabajo" element={<KeyFinancialAssumptionsModule />} />
            <Route path="/endeudamiento-coste" element={<KeyFinancialAssumptionsModule />} />
            <Route path="/inversiones" element={<KeyFinancialAssumptionsModule />} />
            <Route path="/supuestos" element={<KeyFinancialAssumptionsModule />} />
            
            {/* Sección 5 - Proyecciones */}
            <Route path="/pyg-proyectado" element={<ProjectionsModule />} />
            <Route path="/pyg-analitico-proyectado" element={<ProjectionsModule />} />
            <Route path="/balance-proyectado" element={<ProjectionsModule />} />
            <Route path="/flujos-proyectado" element={<ProjectionsModule />} />
            <Route path="/ratios-proyectado" element={<ProjectionsModule />} />
            <Route path="/nof-proyectado" element={<ProjectionsModule />} />
            <Route path="/servicio-deuda-proyectado" element={<ProjectionsModule />} />
            <Route path="/segmentos-proyectado" element={<ProjectionsModule />} />
            
            {/* Sección 6 - Sensibilidad */}
            <Route path="/metodologia-sensibilidad" element={<MetodologiaSensibilidadModule />} />
            <Route path="/escenarios" element={<SensitivityModule />} />
            
            {/* Sección 7 - Valoración EVA */}
            <Route path="/introduccion-eva" element={<ValuationModule />} />
            <Route path="/calculo-eva" element={<ValuationModule />} />
            <Route path="/interpretacion-eva" element={<ValuationModule />} />
            <Route path="/valoracion" element={<ValuationModule />} />
            
            {/* Simulador */}
            <Route path="/simulador" element={<SimulatorModule />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
