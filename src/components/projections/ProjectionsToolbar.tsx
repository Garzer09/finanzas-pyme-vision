import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileDown, FileText, TrendingUp, Percent, Euro, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInflationData } from '@/hooks/useInflationData'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ProjectionsToolbarProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  onScenarioChange: (scenario: 'base' | 'optimista' | 'pesimista') => void
  yearRange: [number, number]
  onYearRangeChange: (range: [number, number]) => void
  unit: 'k€' | 'm€' | '%'
  onUnitChange: (unit: 'k€' | 'm€' | '%') => void
  includeInflation: boolean
  onInflationChange: (include: boolean) => void
  onExportPDF: () => void
  onExportPPTX: () => void
}

export function ProjectionsToolbar({
  scenario,
  onScenarioChange,
  yearRange,
  onYearRangeChange,
  unit,
  onUnitChange,
  includeInflation,
  onInflationChange,
  onExportPDF,
  onExportPPTX
}: ProjectionsToolbarProps) {
  const { 
    inflationRates, 
    loading: inflationLoading, 
    getAverageInflation,
    getInflationForYear 
  } = useInflationData({ 
    region: 'EU', 
    yearRange: [new Date().getFullYear(), new Date().getFullYear() + yearRange[1]] 
  })

  const formatCurrency = (value: number) => {
    if (unit === 'm€') return `€${(value / 1000).toFixed(1)}M`
    if (unit === 'k€') return `€${value}K`
    return `${value}%`
  }

  // Mock KPIs - en producción vendrían de props o hook
  const kpis = {
    ventasA5: 2450,
    ebitdaPercent: 18.5,
    roeA5: 16.2
  }

  const averageInflation = getAverageInflation()
  const currentYear = new Date().getFullYear()
  const endYearInflation = getInflationForYear(currentYear + yearRange[1])

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Scenario Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Escenario:
              </label>
              <Select value={scenario} onValueChange={onScenarioChange}>
                <SelectTrigger className="w-32" aria-label="Seleccionar escenario">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="pesimista">Pesimista</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="optimista">Optimista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Range Slider */}
            <div className="flex items-center gap-3 min-w-32">
              <label className="text-sm font-medium text-muted-foreground">
                Años {yearRange[0]}-{yearRange[1]}:
              </label>
              <div className="w-24">
                <Slider
                  value={[yearRange[1]]}
                  onValueChange={([max]) => onYearRangeChange([1, max])}
                  min={2}
                  max={10}
                  step={1}
                  className="w-full"
                  aria-label={`Rango de años: ${yearRange[0]} a ${yearRange[1]}`}
                />
              </div>
            </div>

            {/* Unit Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Unidad:
              </label>
              <Select value={unit} onValueChange={onUnitChange}>
                <SelectTrigger className="w-20" aria-label="Seleccionar unidad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="k€">K€</SelectItem>
                  <SelectItem value="m€">M€</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inflation Toggle */}
            <div className="flex items-center gap-2">
              <label htmlFor="inflation" className="text-sm font-medium text-muted-foreground">
                Incluir inflación:
              </label>
              <Switch
                id="inflation"
                checked={includeInflation}
                onCheckedChange={onInflationChange}
                aria-label="Incluir efectos de inflación"
              />
              {includeInflation && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white">
                      <div className="text-xs">
                        <p>Inflación promedio: {averageInflation.toFixed(1)}%</p>
                        <p>Año {currentYear + yearRange[1]}: {endYearInflation.toFixed(1)}%</p>
                        <p className="text-muted-foreground">Datos del BCE</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* KPIs Row */}
          <div className="flex items-center gap-4 lg:ml-auto">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs">Ventas A5: {formatCurrency(kpis.ventasA5)}</span>
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Percent className="h-3 w-3 text-success" />
                <span className="text-xs">EBITDA: {kpis.ebitdaPercent}%</span>
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Euro className="h-3 w-3 text-warning" />
                <span className="text-xs">ROE A5: {kpis.roeA5}%</span>
              </Badge>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExportPDF}
                className="gap-1"
                aria-label="Exportar proyecciones en PDF"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExportPPTX}
                className="gap-1"
                aria-label="Exportar proyecciones en PowerPoint"
              >
                <FileText className="h-4 w-4" />
                PPTX
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}