import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DebugToolbar } from "@/components/DebugToolbar";

import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { PeriodProvider } from "./contexts/PeriodContext";
import { AdminImpersonationProvider } from "./contexts/AdminImpersonationContext";

import { ProtectedRoute } from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ExcelUploadPage from "./pages/ExcelUploadPage";
import FilesDashboardPage from "./pages/FilesDashboardPage";
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
import { SensitivityModuleNew } from "./components/modules/SensitivityModuleNew";
import { EVAValuationModule } from "./components/modules/EVAValuationModule";
import { SituacionActualModule } from "./components/modules/SituacionActualModule";
import { SimulatorModule } from "./components/modules/SimulatorModule";
import { PremisasIngresosModule } from "./components/modules/PremisasIngresosModule";

import { ProfitLossCurrentModule } from "./components/modules/ProfitLossCurrentModule";
import { BalanceSheetCurrentModule } from "./components/modules/BalanceSheetCurrentModule";
import { FinancialRatiosCurrentModule } from "./components/modules/FinancialRatiosCurrentModule";
import { CompanyDescriptionModule } from "./components/modules/CompanyDescriptionModule";
import { AnalyticalPLCurrentModule } from "./components/modules/AnalyticalPLCurrentModule";
import { SalesSegmentsModule } from "./components/modules/SalesSegmentsModule";
import ConclusionsPage from "./pages/ConclusionsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ClaudeTestingPage from "./pages/ClaudeTestingPage";
import { AdminCargaPlantillasPage } from "./pages/AdminCargaPlantillasPage";

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AdminImpersonationProvider>
        <PeriodProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<HomePage />} />
         <Route path="/subir-excel" element={<ExcelUploadPage />} />
         <Route path="/archivos" element={<FilesDashboardPage />} />
         <Route path="/suscripcion" element={<SubscriptionPage />} />
         <Route path="/descripcion-empresa" element={<CompanyDescriptionModule />} />
           <Route path="/admin/settings" element={<AdminSettingsPage />} />
           <Route path="/admin/users" element={<AdminUsersPage />} />
           <Route path="/admin/carga-plantillas" element={<AdminCargaPlantillasPage />} />
           <Route path="/testing-claude" element={<ClaudeTestingPage />} />
        
        {/* Core Financial Analysis */}
        <Route path="/cuenta-pyg" element={<CuentaPyGPage />} />
        <Route path="/balance-situacion" element={<BalanceSituacionPage />} />
        <Route path="/ratios-financieros" element={<RatiosFinancierosPage />} />
        
        {/* Advanced Financial Analysis - NEW */}
        <Route path="/flujos-caja" element={<CashFlowPage />} />
        <Route path="/analisis-nof" element={<NOFAnalysisPage />} />
        <Route path="/punto-muerto" element={<BreakEvenPage />} />
        <Route path="/endeudamiento" element={<DebtPoolPage />} />
        <Route path="/servicio-deuda" element={<DebtServicePage />} />
        
        {/* Sección 3 - Situación Actual */}
        <Route path="/situacion-actual" element={<SituacionActualModule />} />
        <Route path="/pyg-actual" element={<ProfitLossCurrentModule />} />
        <Route path="/pyg-analitico-actual" element={<AnalyticalPLCurrentModule />} />
        <Route path="/balance-actual" element={<BalanceSheetCurrentModule />} />
        <Route path="/flujos-actual" element={<FinancialAnalysisModule />} />
        <Route path="/ratios-actual" element={<FinancialRatiosCurrentModule />} />
        <Route path="/punto-muerto-actual" element={<FinancialAnalysisModule />} />
        <Route path="/endeudamiento-actual" element={<FinancialAnalysisModule />} />
        <Route path="/servicio-deuda-actual" element={<FinancialAnalysisModule />} />
        
        <Route path="/nof-actual" element={<FinancialAnalysisModule />} />
        <Route path="/segmentos-actual" element={<SalesSegmentsModule />} />
        
        {/* Sección 4 - Supuestos */}
        <Route path="/supuestos-financieros" element={<KeyFinancialAssumptionsModule />} />
        
        {/* Sección 5 - Proyecciones */}
        <Route path="/proyecciones" element={<ProjectionsModule />} />
        
        {/* Sección 6 - Sensibilidad */}
        <Route path="/escenarios" element={<SensitivityModuleNew />} />
        
        {/* Sección 7 - Valoración EVA */}
        <Route path="/valoracion-eva" element={<EVAValuationModule />} />
        
        {/* Simulador */}
        <Route path="/simulador" element={<SimulatorModule />} />
        
        {/* Conclusiones */}
        <Route path="/conclusiones" element={<ConclusionsPage />} />
        
        <Route path="*" element={<NotFound />} />
          </Routes>
          <DebugToolbar />
          </TooltipProvider>
        </PeriodProvider>
      </AdminImpersonationProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
