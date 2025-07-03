import { useState, lazy, Suspense } from 'react';
import { DashboardPageHeader } from '@/components/DashboardPageHeader';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProjectionsToolbar } from '@/components/projections/ProjectionsToolbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  BarChart3, 
  Building2, 
  Activity, 
  TrendingUp, 
  CircleDot, 
  AlertTriangle, 
  Users 
} from 'lucide-react';

// Lazy load tab components for better performance
const PLProyectadoTab = lazy(() => import('@/components/projections/tabs/PLProyectadoTab').then(module => ({ default: module.PLProyectadoTab })));
const CashFlowTab = lazy(() => import('@/components/projections/tabs/CashFlowTab').then(module => ({ default: module.CashFlowTab })));
const RatiosTab = lazy(() => import('@/components/projections/tabs/RatiosTab').then(module => ({ default: module.RatiosTab })));

// Skeleton component for loading states
const TabSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  </div>
);

export const ProjectionsModule = () => {
  const { toast } = useToast();
  
  // Toolbar state
  const [scenario, setScenario] = useState<'base' | 'optimista' | 'pesimista'>('base');
  const [yearRange, setYearRange] = useState<[number, number]>([1, 5]);
  const [unit, setUnit] = useState<'k€' | 'm€' | '%'>('k€');
  const [includeInflation, setIncludeInflation] = useState(false);
  const [activeTab, setActiveTab] = useState('pl-proyectado');

  // Tab configuration
  const tabs = [
    { id: 'pl-proyectado', label: 'P&G Proyectado', icon: FileText, component: PLProyectadoTab },
    { id: 'pl-analitico', label: 'P&G Analítico', icon: BarChart3, component: () => <div className="p-8 text-center text-muted-foreground">P&G Analítico - En desarrollo</div> },
    { id: 'balance-proyectado', label: 'Balance Proyectado', icon: Building2, component: () => <div className="p-8 text-center text-muted-foreground">Balance Proyectado - En desarrollo</div> },
    { id: 'cash-flow', label: 'Flujos de Caja', icon: Activity, component: CashFlowTab },
    { id: 'ratios', label: 'Ratios Financieros', icon: TrendingUp, component: RatiosTab },
    { id: 'nof', label: 'NOF', icon: CircleDot, component: () => <div className="p-8 text-center text-muted-foreground">NOF Proyectado - En desarrollo</div> },
    { id: 'servicio-deuda', label: 'Servicio Deuda', icon: AlertTriangle, component: () => <div className="p-8 text-center text-muted-foreground">Servicio Deuda - En desarrollo</div> },
    { id: 'ventas-segmentos', label: 'Ventas Segmentos', icon: Users, component: () => <div className="p-8 text-center text-muted-foreground">Ventas Segmentos - En desarrollo</div> }
  ];

  // Export handlers
  const handleExportPDF = () => {
    toast({ title: "Exportando PDF", description: "Se está generando el reporte de proyecciones en PDF..." });
  };

  const handleExportPPTX = () => {
    toast({ title: "Exportando PPTX", description: "Se está generando la presentación de proyecciones..." });
  };

  const renderTabContent = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return null;

    const Component = tab.component;
    return (
      <Suspense fallback={<TabSkeleton />}>
        <Component scenario={scenario} yearRange={yearRange} unit={unit} includeInflation={includeInflation} />
      </Suspense>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        {/* Sticky Toolbar */}
        <ProjectionsToolbar
          scenario={scenario}
          onScenarioChange={setScenario}
          yearRange={yearRange}
          onYearRangeChange={setYearRange}
          unit={unit}
          onUnitChange={setUnit}
          includeInflation={includeInflation}
          onInflationChange={setIncludeInflation}
          onExportPDF={handleExportPDF}
          onExportPPTX={handleExportPPTX}
        />
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6 pb-0">
            <DashboardPageHeader
              title="Proyecciones Financieras (Año 1-5)"
              subtitle={`Análisis prospectivo en escenario ${scenario} con ${includeInflation ? 'efectos de' : 'sin'} inflación`}
            />
          </div>

          <div className="px-6 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-8 h-auto gap-1 bg-muted/50 p-1 w-max min-w-full">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap"
                        aria-label={`Pestaña ${tab.label}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <div className="mt-6">
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    {renderTabContent(tab.id)}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};