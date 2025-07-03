import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Euro, Percent } from "lucide-react"
import { useState } from "react"

interface DistributionTabProps {
  segmentType: "producto" | "region" | "cliente"
  data: Array<{
    name: string
    sales: number
    participation: number
  }>
}

export function DistributionTab({ segmentType, data }: DistributionTabProps) {
  const [metric, setMetric] = useState<"euros" | "percentage">("euros")

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard'
    }).format(value)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-md">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Ventas: </span>
              <span className="font-medium text-primary">{formatCurrency(data.sales)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Participación: </span>
              <span className="font-medium text-primary">{data.participation.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const getSegmentLabel = () => {
    switch (segmentType) {
      case "producto": return "producto"
      case "region": return "región"
      case "cliente": return "tipo de cliente"
      default: return "segmento"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              Distribución por {getSegmentLabel().charAt(0).toUpperCase() + getSegmentLabel().slice(1)}
            </CardTitle>
            <ToggleGroup 
              type="single" 
              value={metric} 
              onValueChange={(value) => value && setMetric(value as "euros" | "percentage")}
              className="bg-muted p-1 rounded-lg"
            >
              <ToggleGroupItem 
                value="euros" 
                className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                aria-label="Ver en euros"
              >
                <Euro className="h-4 w-4" />
                Euros
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="percentage" 
                className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                aria-label="Ver en porcentaje"
              >
                <Percent className="h-4 w-4" />
                Porcentaje
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={metric === "euros" ? formatCurrency : (value) => `${value}%`}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={95}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={metric === "euros" ? "sales" : "participation"}
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  stroke="hsl(var(--primary-dark))"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}