import { useState, lazy, Suspense, memo } from "react"
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { KpiToolbar } from "@/components/segments/KpiToolbar"
import { SegmentFilter } from "@/components/segments/SegmentFilter"
import { InsightsPanel } from "@/components/segments/InsightsPanel"
import { useSalesInsights } from "@/hooks/useSalesInsights"
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Euro, BarChart3, LineChart, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { SegmentFilters } from "@/schemas/segment-schemas"

// Lazy load tab components
const DistributionTab = lazy(() => import("@/components/segments/DistributionTab").then(module => ({ default: module.DistributionTab })))
const EvolutionTab = lazy(() => import("@/components/segments/EvolutionTab").then(module => ({ default: module.EvolutionTab })))
const TopBottomTab = lazy(() => import("@/components/segments/TopBottomTab").then(module => ({ default: module.TopBottomTab })))

export const SalesSegmentsModule = memo(() => {
  const { toast } = useToast()
  
  // State for filters
  const [filters, setFilters] = useState<SegmentFilters>({
    year: new Date().getFullYear(),
    period: "mes",
    segmentType: "producto"
  })

  const [activeTab, setActiveTab] = useState("distribucion")

  // Mock data - in real app this would come from API/Supabase
  const kpiData = {
    totalSales: 2450000,
    yoyGrowth: 12.5,
    averageTicket: 850,
    leadingSegment: {
      name: "Productos Premium",
      participation: 34.2
    }
  }

  // Mock segment data with yoyGrowth for insights
  const distributionData = [
    { name: "Productos Premium", sales: 850000, participation: 34.2, yoyGrowth: 18.5 },
    { name: "Productos Estándar", sales: 620000, participation: 25.1, yoyGrowth: 12.3 },
    { name: "Productos Básicos", sales: 480000, participation: 19.4, yoyGrowth: 8.7 },
    { name: "Servicios", sales: 350000, participation: 14.1, yoyGrowth: 22.1 },
    { name: "Accesorios", sales: 150000, participation: 7.2, yoyGrowth: -12.4 }
  ]

  const evolutionData = [
    { period: "Ene", "Productos Premium": 95000, "Productos Estándar": 78000, "Productos Básicos": 65000, "Servicios": 45000 },
    { period: "Feb", "Productos Premium": 88000, "Productos Estándar": 72000, "Productos Básicos": 58000, "Servicios": 42000 },
    { period: "Mar", "Productos Premium": 102000, "Productos Estándar": 85000, "Productos Básicos": 71000, "Servicios": 51000 },
    { period: "Abr", "Productos Premium": 97000, "Productos Estándar": 80000, "Productos Básicos": 67000, "Servicios": 48000 },
    { period: "May", "Productos Premium": 105000, "Productos Estándar": 87000, "Productos Básicos": 73000, "Servicios": 53000 },
    { period: "Jun", "Productos Premium": 112000, "Productos Estándar": 92000, "Productos Básicos": 78000, "Servicios": 57000 }
  ]

  const segments = ["Productos Premium", "Productos Estándar", "Productos Básicos", "Servicios"]

  const topBottomData = [
    { id: "1", name: "Productos Premium", sales: 850000, yoyGrowth: 18.5, averageTicket: 1250 },
    { id: "2", name: "Productos Estándar", sales: 620000, yoyGrowth: 12.3, averageTicket: 780 },
    { id: "3", name: "Productos Básicos", sales: 480000, yoyGrowth: 8.7, averageTicket: 450 },
    { id: "4", name: "Servicios", sales: 350000, yoyGrowth: 22.1, averageTicket: 890 },
    { id: "5", name: "Accesorios", sales: 150000, yoyGrowth: -12.4, averageTicket: 125 }
  ]

  // Generate insights based on distribution data
  const { insights, isLoading: insightsLoading } = useSalesInsights({
    segmentType: filters.segmentType,
    data: distributionData
  })

  // Export functions
  const handleExportPDF = () => {
    toast({
      title: "Exportando PDF",
      description: "Se está generando el reporte en formato PDF...",
    })
    // Here you would implement actual PDF export logic
  }

  const handleExportCSV = () => {
    toast({
      title: "Descargando CSV",
      description: "Los datos se están descargando en formato CSV...",
    })
    // Here you would implement actual CSV export logic
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)

  const formatPercentage = (value: number) => 
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

  const kpiCards = [
    {
      title: "Ventas Totales",
      value: formatCurrency(kpiData.totalSales),
      icon: Euro,
      trend: "neutral" as const,
      description: `Periodo: ${filters.period} ${filters.year}`
    },
    {
      title: "Crecimiento YoY",
      value: formatPercentage(kpiData.yoyGrowth),
      icon: kpiData.yoyGrowth >= 0 ? TrendingUp : TrendingDown,
      trend: kpiData.yoyGrowth >= 0 ? "positive" : "negative" as const,
      description: "Comparativa año anterior"
    },
    {
      title: "Ticket Medio",
      value: formatCurrency(kpiData.averageTicket),
      icon: DollarSign,
      trend: "neutral" as const,
      description: "Promedio por transacción"
    },
    {
      title: "Segmento Líder",
      value: kpiData.leadingSegment.name,
      subtitle: `${kpiData.leadingSegment.participation}% participación`,
      icon: Target,
      trend: "positive" as const,
      description: "Mayor contribución a ventas"
    }
  ]

  const TabSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        {/* Sticky Toolbar */}
        <KpiToolbar
          year={filters.year}
          period={filters.period}
          onYearChange={(year) => setFilters(prev => ({ ...prev, year }))}
          onPeriodChange={(period) => setFilters(prev => ({ ...prev, period }))}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Header */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Análisis por Segmentos
                </h1>
                <p className="text-muted-foreground">
                  Facturación detallada por producto, región y tipo de cliente
                </p>
              </div>

              {/* Segment Filter */}
              <div className="max-w-md">
                <SegmentFilter
                  segmentType={filters.segmentType}
                  onSegmentTypeChange={(segmentType) => 
                    setFilters(prev => ({ ...prev, segmentType }))
                  }
                />
              </div>
            </div>

            {/* KPI Header Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon
                return (
                  <Card 
                    key={kpi.title}
                    className={cn(
                      "relative overflow-hidden",
                      kpi.trend === "positive" && "border-t-4 border-t-success",
                      kpi.trend === "negative" && "border-t-4 border-t-destructive"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {kpi.title}
                        </CardTitle>
                        <Icon 
                          className={cn(
                            "h-4 w-4",
                            kpi.trend === "positive" && "text-success",
                            kpi.trend === "negative" && "text-destructive",
                            kpi.trend === "neutral" && "text-primary"
                          )} 
                          aria-hidden="true"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div 
                          className={cn(
                            "text-2xl font-bold",
                            kpi.trend === "positive" && "text-success",
                            kpi.trend === "negative" && "text-destructive",
                            kpi.trend === "neutral" && "text-foreground"
                          )}
                        >
                          {kpi.value}
                        </div>
                        {kpi.subtitle && (
                          <div className="text-sm font-medium text-primary">
                            {kpi.subtitle}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {kpi.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </section>

            {/* Analysis Tabs */}
            <section>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="distribucion"
                    className="gap-2"
                    aria-label="Análisis de distribución"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Distribución
                  </TabsTrigger>
                  <TabsTrigger 
                    value="evolucion"
                    className="gap-2"
                    aria-label="Evolución temporal"
                  >
                    <LineChart className="h-4 w-4" />
                    Evolución
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ranking"
                    className="gap-2"
                    aria-label="Ranking top y bottom"
                  >
                    <Trophy className="h-4 w-4" />
                    Top/Bottom 10
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="distribucion">
                  <Suspense fallback={<TabSkeleton />}>
                    <DistributionTab 
                      segmentType={filters.segmentType}
                      data={distributionData}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="evolucion">
                  <Suspense fallback={<TabSkeleton />}>
                    <EvolutionTab 
                      segmentType={filters.segmentType}
                      data={evolutionData}
                      segments={segments}
                    />
                  </Suspense>
                </TabsContent>

                <TabsContent value="ranking">
                  <Suspense fallback={<TabSkeleton />}>
                    <TopBottomTab 
                      segmentType={filters.segmentType}
                      data={topBottomData}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </section>
          </main>

          {/* Insights Sidebar - Hidden on mobile, visible on lg+ */}
          <aside className="hidden lg:block w-80 border-l border-border bg-muted/50 p-6 overflow-auto">
            <InsightsPanel
              insights={insights}
              isLoading={insightsLoading}
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
            />
          </aside>
        </div>
        
        {/* Mobile Insights Panel - Visible only on mobile */}
        <div className="lg:hidden border-t border-border bg-muted/50 p-6">
          <InsightsPanel
            insights={insights}
            isLoading={insightsLoading}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>
    </div>
  )
})