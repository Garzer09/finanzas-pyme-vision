import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiToolbarProps {
  year: number
  period: "mes" | "trimestre" | "ytd"
  onYearChange: (year: number) => void
  onPeriodChange: (period: "mes" | "trimestre" | "ytd") => void
  className?: string
}

export function KpiToolbar({
  year,
  period,
  onYearChange,
  onPeriodChange,
  className
}: KpiToolbarProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const periods = [
    { value: "mes", label: "Mensual" },
    { value: "trimestre", label: "Trimestral" },
    { value: "ytd", label: "Año hasta la fecha" }
  ] as const

  return (
    <div className={cn(
      "sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border py-4 px-6",
      className
    )}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Filtros:</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="year-select" className="text-sm font-medium whitespace-nowrap">
            Año
          </Label>
          <Select
            value={year.toString()}
            onValueChange={(value) => onYearChange(parseInt(value))}
          >
            <SelectTrigger 
              id="year-select"
              className="w-32"
              aria-label={`Año seleccionado: ${year}`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {years.map((yearOption) => (
                <SelectItem key={yearOption} value={yearOption.toString()}>
                  {yearOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="period-select" className="text-sm font-medium whitespace-nowrap">
            Periodo
          </Label>
          <Select
            value={period}
            onValueChange={onPeriodChange}
          >
            <SelectTrigger 
              id="period-select"
              className="w-48"
              aria-label={`Periodo seleccionado: ${periods.find(p => p.value === period)?.label}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((periodOption) => (
                <SelectItem key={periodOption.value} value={periodOption.value}>
                  {periodOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}