import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import SubscriptionPage from "./pages/SubscriptionPage";
// Core Financial Analysis Pages
import { CuentaPyGPage } from "./pages/CuentaPyGPage";
import { BalanceSituacionPage } from "./pages/BalanceSituacionPage";
import { RatiosFinancierosPage } from "./pages/RatiosFinancierosPage";
// Advanced Financial Analysis Pages
import CashFlowPage from "./pages/CashFlowPage";
import NOFAnalysisPage from "./pages/NOFAnalysisPage";
import BreakEvenPage from "./pages/BreakEvenPage";
import DebtPoolPage from "./pages/DebtPoolPage";
import DebtServicePage from "./pages/DebtServicePage";
// Existing modules
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
import { AnalyticalPLCurrentModule } from "./components/modules/AnalyticalPLCurrentModule";
import { RentabilityModule } from "./components/modules/RentabilityModule";
import ConclusionsPage from "./pages/ConclusionsPage";

const queryClient = new QueryClient();

const App = () => (
  <div className="dark">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/subir-excel" element={<ProtectedRoute><ExcelUploadPage /></ProtectedRoute>} />
          <Route path="/suscripcion" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/descripcion-empresa" element={<ProtectedRoute><CompanyDescriptionModule /></ProtectedRoute>} />
          
          {/* Core Financial Analysis */}
          <Route path="/cuenta-pyg" element={<ProtectedRoute><CuentaPyGPage /></ProtectedRoute>} />
          <Route path="/balance-situacion" element={<ProtectedRoute><BalanceSituacionPage /></ProtectedRoute>} />
          <Route path="/ratios-financieros" element={<ProtectedRoute><RatiosFinancierosPage /></ProtectedRoute>} />
          
          {/* Advanced Financial Analysis - NEW */}
          <Route path="/flujos-caja" element={<ProtectedRoute><CashFlowPage /></ProtectedRoute>} />
          <Route path="/analisis-nof" element={<ProtectedRoute><NOFAnalysisPage /></ProtectedRoute>} />
          <Route path="/punto-muerto" element={<ProtectedRoute><BreakEvenPage /></ProtectedRoute>} />
          <Route path="/endeudamiento" element={<ProtectedRoute><DebtPoolPage /></ProtectedRoute>} />
          <Route path="/servicio-deuda" element={<ProtectedRoute><DebtServicePage /></ProtectedRoute>} />
          
          {/* Sección 3 - Situación Actual */}
          <Route path="/situacion-actual" element={<ProtectedRoute><SituacionActualModule /></ProtectedRoute>} />
          <Route path="/pyg-actual" element={<ProtectedRoute><ProfitLossCurrentModule /></ProtectedRoute>} />
          <Route path="/pyg-analitico-actual" element={<ProtectedRoute><AnalyticalPLCurrentModule /></ProtectedRoute>} />
          <Route path="/balance-actual" element={<ProtectedRoute><BalanceSheetCurrentModule /></ProtectedRoute>} />
          <Route path="/flujos-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          <Route path="/ratios-actual" element={<ProtectedRoute><FinancialRatiosCurrentModule /></ProtectedRoute>} />
          <Route path="/punto-muerto-actual" element={<ProtectedRoute><RentabilityModule /></ProtectedRoute>} />
          <Route path="/endeudamiento-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          <Route path="/servicio-deuda-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          <Route path="/tesoreria-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          <Route path="/nof-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          <Route path="/segmentos-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
          
          {/* Sección 4 - Supuestos */}
          <Route path="/premisas-ingresos" element={<ProtectedRoute><PremisasIngresosModule /></ProtectedRoute>} />
          <Route path="/estructura-costes" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
          <Route path="/capital-trabajo" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
          <Route path="/endeudamiento-coste" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
          <Route path="/inversiones" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
          <Route path="/supuestos" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
          
          {/* Sección 5 - Proyecciones */}
          <Route path="/pyg-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/pyg-analitico-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/balance-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/flujos-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/ratios-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/nof-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/servicio-deuda-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          <Route path="/segmentos-proyectado" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
          
          {/* Sección 6 - Sensibilidad */}
          <Route path="/metodologia-sensibilidad" element={<ProtectedRoute><MetodologiaSensibilidadModule /></ProtectedRoute>} />
          <Route path="/escenarios" element={<ProtectedRoute><SensitivityModule /></ProtectedRoute>} />
          
          {/* Sección 7 - Valoración EVA */}
          <Route path="/introduccion-eva" element={<ProtectedRoute><ValuationModule /></ProtectedRoute>} />
          <Route path="/calculo-eva" element={<ProtectedRoute><ValuationModule /></ProtectedRoute>} />
          <Route path="/interpretacion-eva" element={<ProtectedRoute><ValuationModule /></ProtectedRoute>} />
          <Route path="/valoracion" element={<ProtectedRoute><ValuationModule /></ProtectedRoute>} />
          
          {/* Simulador */}
          <Route path="/simulador" element={<ProtectedRoute><SimulatorModule /></ProtectedRoute>} />
          
          {/* Conclusiones */}
          <Route path="/conclusiones" element={<ProtectedRoute><ConclusionsPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </div>
);

export default App;
