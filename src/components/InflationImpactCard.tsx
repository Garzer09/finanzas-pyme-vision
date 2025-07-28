import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useInflationData } from '@/hooks/useInflationData'
import { calculateRealVsNominal } from '@/utils/inflationAdjustments'

interface InflationImpactCardProps {
  includeInflation: boolean
  yearRange: [number, number]
  className?: string
}

export function InflationImpactCard({ includeInflation, yearRange, className }: InflationImpactCardProps) {
  const { getAverageInflation, getInflationForYear } = useInflationData({
    region: 'EU',
    yearRange: [new Date().getFullYear(), new Date().getFullYear() + yearRange[1]]
  })

  if (!includeInflation) {
    return null
  }

  const currentYear = new Date().getFullYear()
  const endYear = currentYear + yearRange[1]
  const averageInflation = getAverageInflation()
  const endYearInflation = getInflationForYear(endYear)

  // Example calculation: €1M in final year
  const nominalValue = 1000000
  const realAnalysis = calculateRealVsNominal(nominalValue, endYear, currentYear, averageInflation)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-primary" />
          Impacto de la Inflación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Inflación Promedio</p>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {averageInflation.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Año {yearRange[1]}</p>
            <Badge variant="outline" className="gap-1">
              <TrendingDown className="h-3 w-3" />
              {endYearInflation.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Ejemplo: €1M en año {yearRange[1]}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Valor nominal:</span>
              <span className="font-medium">€{(realAnalysis.nominal / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Valor real:</span>
              <span className="font-medium text-muted-foreground">€{(realAnalysis.real / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Pérdida de poder:</span>
              <span className="font-medium text-destructive">-{realAnalysis.adjustment.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}