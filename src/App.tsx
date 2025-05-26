
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { KeyFinancialAssumptionsModule } from "./components/modules/KeyFinancialAssumptionsModule";
import { FinancialAnalysisModule } from "./components/modules/FinancialAnalysisModule";
import { ProjectionsModule } from "./components/modules/ProjectionsModule";
import { SensitivityModule } from "./components/modules/SensitivityModule";
import { ValuationModule } from "./components/modules/ValuationModule";

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
            <Route path="/supuestos" element={<KeyFinancialAssumptionsModule />} />
            <Route path="/analisis" element={<FinancialAnalysisModule />} />
            <Route path="/proyecciones" element={<ProjectionsModule />} />
            <Route path="/escenarios" element={<SensitivityModule />} />
            <Route path="/valoracion" element={<ValuationModule />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
