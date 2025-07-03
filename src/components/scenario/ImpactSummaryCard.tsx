import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImpactSummaryCardProps {
  ebitdaBase: number
  ebitdaSimulated: number
  deltaPercentage: number
  marginSimulated: number
  cashFlow: number
  dscr: number
}

export function ImpactSummaryCard({
  ebitdaBase,
  ebitdaSimulated,
  deltaPercentage,
  marginSimulated,
  cashFlow,
  dscr
}: ImpactSummaryCardProps) {
  const isPositive = deltaPercentage >= 0
  const formatCurrency = (value: number) => `€${value.toLocaleString()}K`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const metrics = [
    {
      label: "EBITDA Base",
      value: formatCurrency(ebitdaBase),
      icon: BarChart3,
      color: "text-muted-foreground"
    },
    {
      label: "EBITDA Simulado",
      value: formatCurrency(ebitdaSimulated),
      icon: TrendingUp,
      color: isPositive ? "text-success" : "text-destructive"
    },
    {
      label: "Variación (%)",
      value: `${deltaPercentage > 0 ? '+' : ''}${formatPercentage(deltaPercentage)}`,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? "text-success" : "text-destructive"
    },
    {
      label: "Margen Simulado",
      value: formatPercentage(marginSimulated),
      icon: Percent,
      color: "text-primary"
    },
    {
      label: "Cash Flow",
      value: formatCurrency(cashFlow),
      icon: DollarSign,
      color: "text-primary"
    },
    {
      label: "DSCR",
      value: dscr.toFixed(2),
      icon: Activity,
      color: dscr >= 1.25 ? "text-success" : dscr >= 1.0 ? "text-warning" : "text-destructive"
    }
  ]

  return (
    <Card className="bg-card border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Resumen de Impacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="flex flex-col space-y-2 p-3 rounded-lg bg-muted/50 border"
                role="region"
                aria-label={`${metric.label}: ${metric.value}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", metric.color)} aria-hidden="true" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <span className={cn("text-lg font-bold", metric.color)}>
                  {metric.value}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}