import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, AreaChart, Area } from 'recharts'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TrendingUp } from "lucide-react"
import { useState } from "react"

interface EvolutionTabProps {
  segmentType: "producto" | "region" | "cliente"
  data: Array<{
    period: string
    [key: string]: string | number
  }>
  segments: string[]
}

export function EvolutionTab({ segmentType, data, segments }: EvolutionTabProps) {
  const [isStacked, setIsStacked] = useState(false)

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: value >= 1000000 ? 'compact' : 'standard'
    }).format(value)

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-md">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}: </span>
                <span className="font-medium text-primary">{formatCurrency(entry.value)}</span>
              </p>
            ))}
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

  const ChartComponent = isStacked ? AreaChart : LineChart

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolución por {getSegmentLabel().charAt(0).toUpperCase() + getSegmentLabel().slice(1)}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="stacked-mode"
                checked={isStacked}
                onCheckedChange={setIsStacked}
              />
              <Label htmlFor="stacked-mode" className="text-sm font-medium">
                Acumular
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Brush 
                  dataKey="period" 
                  height={30} 
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                />
                
                {segments.map((segment, index) => {
                  const color = colors[index % colors.length]
                  
                  if (isStacked) {
                    return (
                      <Area
                        key={segment}
                        type="monotone"
                        dataKey={segment}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.6}
                        name={segment}
                      />
                    )
                  } else {
                    return (
                      <Line
                        key={segment}
                        type="monotone"
                        dataKey={segment}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, strokeWidth: 2, r: 4 }}
                        name={segment}
                      />
                    )
                  }
                })}
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}