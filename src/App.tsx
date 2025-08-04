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

import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import RedirectPage from "./pages/RedirectPage";
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
import ViewerMisEmpresasPage from "./pages/ViewerMisEmpresasPage";
import ViewerDashboardPage from "./pages/ViewerDashboardPage";
import { Navigate } from "react-router-dom";

import { AdminCargaPlantillasPage } from "./pages/AdminCargaPlantillasPage";
import AdminEmpresasPage from "./pages/AdminEmpresasPage";
import AdminCargasPage from "./pages/AdminCargasPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/redirect" element={<ProtectedRoute><RedirectPage /></ProtectedRoute>} />
          
         <Route path="/subir-excel" element={<ProtectedRoute><ExcelUploadPage /></ProtectedRoute>} />
         <Route path="/archivos" element={<ProtectedRoute><FilesDashboardPage /></ProtectedRoute>} />
         <Route path="/suscripcion" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
         <Route path="/descripcion-empresa" element={<ProtectedRoute><CompanyDescriptionModule /></ProtectedRoute>} />
          {/* Admin Routes */}
            <Route path="/admin/settings" element={<ProtectedRoute><Navigate to="/admin/users" replace /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/empresas" element={<ProtectedRoute><AdminEmpresasPage /></ProtectedRoute>} />
            <Route path="/admin/carga-plantillas" element={<ProtectedRoute><AdminCargaPlantillasPage /></ProtectedRoute>} />
            <Route path="/admin/cargas" element={<ProtectedRoute><AdminCargasPage /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
            
            {/* Viewer Routes */}
            <Route path="/app/mis-empresas" element={<ProtectedRoute><ViewerMisEmpresasPage /></ProtectedRoute>} />
            <Route path="/app/dashboard" element={<ProtectedRoute><ViewerDashboardPage /></ProtectedRoute>} />
            
        
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
        <Route path="/punto-muerto-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
        <Route path="/endeudamiento-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
        <Route path="/servicio-deuda-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
        
        <Route path="/nof-actual" element={<ProtectedRoute><FinancialAnalysisModule /></ProtectedRoute>} />
        <Route path="/segmentos-actual" element={<ProtectedRoute><SalesSegmentsModule /></ProtectedRoute>} />
        
        {/* Sección 4 - Supuestos */}
        <Route path="/supuestos-financieros" element={<ProtectedRoute><KeyFinancialAssumptionsModule /></ProtectedRoute>} />
        
        {/* Sección 5 - Proyecciones */}
        <Route path="/proyecciones" element={<ProtectedRoute><ProjectionsModule /></ProtectedRoute>} />
        
        {/* Sección 6 - Sensibilidad */}
        <Route path="/escenarios" element={<ProtectedRoute><SensitivityModuleNew /></ProtectedRoute>} />
        
        {/* Sección 7 - Valoración EVA */}
        <Route path="/valoracion-eva" element={<ProtectedRoute><EVAValuationModule /></ProtectedRoute>} />
        
        {/* Simulador */}
        <Route path="/simulador" element={<ProtectedRoute><SimulatorModule /></ProtectedRoute>} />
        
        {/* Conclusiones */}
        <Route path="/conclusiones" element={<ProtectedRoute><ConclusionsPage /></ProtectedRoute>} />
        
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
