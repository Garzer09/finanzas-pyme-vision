import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, CircleDot } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'

interface NOFTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function NOFTab({ scenario, yearRange, unit, includeInflation }: NOFTabProps) {
  // Mock data - en producción vendría de API/Supabase
  const chartData = [
    { year: 'A0', nof: 280, diasNetos: 42, dso: 65, dpo: 23 },
    { year: 'A1', nof: 315, diasNetos: 40, dso: 63, dpo: 23 },
    { year: 'A2', nof: 358, diasNetos: 38, dso: 61, dpo: 23 },
    { year: 'A3', nof: 406, diasNetos: 36, dso: 59, dpo: 23 },
    { year: 'A4', nof: 460, diasNetos: 34, dso: 57, dpo: 23 },
    { year: 'A5', nof: 520, diasNetos: 32, dso: 55, dpo: 23 }
  ].slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: chartData,
    activeTab: 'nof'
  })

  const formatValue = (value: number) => {
    if (unit === 'm€') return `€${(value / 1000).toFixed(1)}M`
    if (unit === 'k€') return `€${value}K`
    return `${value}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg p-3 shadow-lg" role="tooltip">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}: </span>
              <span className="font-medium text-primary">
                {entry.name.includes('Días') ? `${entry.value} días` : formatValue(entry.value)}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.map((insight) => (
        <Alert key={insight.id} className="border-primary/20 bg-primary/5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>{insight.title}:</strong> {insight.description}
          </AlertDescription>
        </Alert>
      ))}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDot className="h-5 w-5 text-primary" />
            Evolución NOF y Días Netos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => formatValue(value)}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `${value}d`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="nof" 
                  name="NOF"
                  fill="#005E8A" 
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="diasNetos" 
                  name="Días Netos (DSO-DPO)"
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="dso" 
                  name="DSO"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="dpo" 
                  name="DPO"
                  stroke="#dc2626" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* NOF Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NOF A5</p>
                <p className="text-2xl font-bold text-primary">{formatValue(520)}</p>
                <p className="text-xs text-muted-foreground">+86% vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CircleDot className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Días Netos A5</p>
                <p className="text-2xl font-bold text-success">32 días</p>
                <p className="text-xs text-muted-foreground">-10 días vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <CircleDot className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">NOF/Ventas A5</p>
                <p className="text-2xl font-bold text-warning">13.5%</p>
                <p className="text-xs text-muted-foreground">-10pp vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <CircleDot className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Working Capital Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle del Capital de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Cuentas por Cobrar</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DSO A0:</span>
                  <span className="text-sm font-medium">65 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DSO A5:</span>
                  <span className="text-sm font-medium">55 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-success">Mejora:</span>
                  <span className="text-sm font-medium text-success">-10 días</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Cuentas por Pagar</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DPO A0:</span>
                  <span className="text-sm font-medium">23 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DPO A5:</span>
                  <span className="text-sm font-medium">23 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estable:</span>
                  <span className="text-sm font-medium">0 días</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Inventarios</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DIO A0:</span>
                  <span className="text-sm font-medium">28 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">DIO A5:</span>
                  <span className="text-sm font-medium">25 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-success">Mejora:</span>
                  <span className="text-sm font-medium text-success">-3 días</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}