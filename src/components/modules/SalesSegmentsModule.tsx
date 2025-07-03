import { useState } from "react"
import { DashboardHeader } from '@/components/DashboardHeader'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiToolbar } from "@/components/segments/KpiToolbar"
import { SegmentFilter } from "@/components/segments/SegmentFilter"
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Euro } from "lucide-react"
import { cn } from "@/lib/utils"
import { SegmentFilters } from "@/schemas/segment-schemas"

export const SalesSegmentsModule = () => {
  // State for filters
  const [filters, setFilters] = useState<SegmentFilters>({
    year: new Date().getFullYear(),
    period: "mes",
    segmentType: "producto"
  })

  // Mock KPI data - in real app this would come from API/Supabase
  const kpiData = {
    totalSales: 2450000,
    yoyGrowth: 12.5,
    averageTicket: 850,
    leadingSegment: {
      name: "Productos Premium",
      participation: 34.2
    }
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

          {/* Placeholder for tabs - will be implemented in next steps */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Análisis Detallado por {filters.segmentType.charAt(0).toUpperCase() + filters.segmentType.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Tabs de análisis</p>
                  <p className="text-muted-foreground">
                    Distribución · Evolución · Top/Bottom 10
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Se implementarán en los siguientes pasos
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  )
}