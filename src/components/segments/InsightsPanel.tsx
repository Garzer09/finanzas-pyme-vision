import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileDown, FileSpreadsheet, Lightbulb, TrendingUp, AlertTriangle, Target, Activity } from "lucide-react"
import { SegmentInsight } from "@/schemas/segment-schemas"
import { cn } from "@/lib/utils"

interface InsightsPanelProps {
  insights: SegmentInsight[]
  isLoading: boolean
  onExportPDF: () => void
  onExportCSV: () => void
  className?: string
}

export function InsightsPanel({ 
  insights, 
  isLoading, 
  onExportPDF, 
  onExportCSV,
  className 
}: InsightsPanelProps) {
  const getInsightIcon = (type: SegmentInsight['type']) => {
    switch (type) {
      case "growth": return TrendingUp
      case "risk": return AlertTriangle
      case "opportunity": return Target
      case "trend": return Activity
      default: return Lightbulb
    }
  }

  const getInsightColor = (type: SegmentInsight['type']) => {
    switch (type) {
      case "growth": return "text-success"
      case "risk": return "text-destructive"
      case "opportunity": return "text-primary"
      case "trend": return "text-muted-foreground"
      default: return "text-primary"
    }
  }

  const getImpactVariant = (impact: SegmentInsight['impact']) => {
    switch (impact) {
      case "high": return "destructive" as const
      case "medium": return "default" as const
      case "low": return "secondary" as const
      default: return "secondary" as const
    }
  }

  const getImpactLabel = (impact: SegmentInsight['impact']) => {
    switch (impact) {
      case "high": return "Alto"
      case "medium": return "Medio"
      case "low": return "Bajo"
      default: return "Bajo"
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Export Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={onExportPDF}
            className="w-full gap-2"
            variant="default"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button 
            onClick={onExportCSV}
            className="w-full gap-2"
            variant="outline"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Descargar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Insights Automáticos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Análisis generado por IA basado en los datos actuales
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay insights disponibles para los datos actuales
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => {
                const Icon = getInsightIcon(insight.type)
                return (
                  <div 
                    key={insight.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5", getInsightColor(insight.type))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground">
                            {insight.title}
                          </h4>
                          <Badge 
                            variant={getImpactVariant(insight.impact)}
                            className="text-xs"
                          >
                            {getImpactLabel(insight.impact)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {!isLoading && insights.length > 0 && (
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Insights actualizados automáticamente basados en los filtros seleccionados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}