import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, TrendingUp, Calendar, Database } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInflationData } from '@/hooks/useInflationData'

interface InflationDataCardProps {
  includeInflation: boolean
  yearRange: [number, number]
  className?: string
}

export function InflationDataCard({ includeInflation, yearRange, className }: InflationDataCardProps) {
  const { 
    inflationRates, 
    loading, 
    getAverageInflation,
    getInflationForYear 
  } = useInflationData({ region: 'EU', yearRange })

  if (!includeInflation) {
    return null
  }

  const currentYear = new Date().getFullYear()
  const averageInflation = getAverageInflation()
  const startYearInflation = getInflationForYear(currentYear)
  const endYearInflation = getInflationForYear(currentYear + yearRange[1])

  // Get the latest available data date
  const latestData = inflationRates.length > 0 ? inflationRates[0] : null
  const lastUpdateDate = latestData ? new Date(latestData.period_date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  }) : 'No disponible'

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Datos de Inflación Aplicados
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-white max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-medium">Fuente: Banco Central Europeo (BCE)</p>
                  <p>Los datos se obtienen directamente de las estadísticas oficiales del BCE sobre inflación en la zona euro.</p>
                  <p>Se aplica inflación compuesta anual a todos los valores monetarios proyectados.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando datos de inflación...</div>
        ) : (
          <>
            {/* Source and Date */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>Fuente: BCE</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Últ. actualización: {lastUpdateDate}</span>
              </div>
            </div>

            {/* Inflation Rates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-primary">
                  {averageInflation.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {startYearInflation.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Año actual</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {endYearInflation.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Año final</div>
              </div>
            </div>

            {/* Applied Fields */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Campos ajustados por inflación:</div>
              <div className="flex flex-wrap gap-1">
                {[
                  'Ingresos', 'Costes', 'EBITDA', 'Activos', 
                  'Pasivos', 'CAPEX', 'Flujo de Efectivo'
                ].map(field => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Methodology */}
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Metodología:</span> Inflación compuesta anual aplicada como 
                <code className="mx-1 px-1 bg-background rounded">valor × (1 + inflación/100)^años</code>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}