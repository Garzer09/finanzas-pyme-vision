import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, Activity } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'
import { useProjections } from '@/hooks/useProjections'
import { useMemo } from 'react'

interface CashFlowTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function CashFlowTab({ scenario, yearRange, unit, includeInflation }: CashFlowTabProps) {
  const { cashFlowData } = useProjections(scenario, yearRange)
  const chartData = cashFlowData.slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: chartData,
    activeTab: 'cash-flow'
  })

  const formatValue = (value: number) => {
    if (unit === 'm€') return `€${(Math.abs(value) / 1000).toFixed(1)}M`
    if (unit === 'k€') return `€${Math.abs(value)}K`
    return `${value}%`
  }

  // Calcular métricas dinámicas para los cards de resumen
  const summaryMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        fcfAcumulado: 0,
        capexTotal: 0,
        cashFinal: 0
      }
    }

    // FCF Acumulado (suma de todos los años)
    const fcfAcumulado = chartData.reduce((sum, year) => sum + year.fcf, 0)
    
    // CAPEX Total (suma de inversiones, valores negativos)
    const capexTotal = Math.abs(chartData.reduce((sum, year) => sum + year.icf, 0))
    
    // Cash Final (último año disponible)
    const cashFinal = chartData[chartData.length - 1]?.cashOnHand || 0

    return {
      fcfAcumulado,
      capexTotal,
      cashFinal
    }
  }, [chartData])

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
                {entry.name === 'Cash on Hand' 
                  ? formatValue(entry.value)
                  : entry.value >= 0 
                    ? `+${formatValue(entry.value)}`
                    : `-${formatValue(entry.value)}`
                }
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
            <Activity className="h-5 w-5 text-primary" />
            Evolución de Flujos de Caja
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
                  tickFormatter={(value) => value >= 0 ? `+${formatValue(value)}` : `-${formatValue(Math.abs(value))}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => formatValue(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="ocf" 
                  name="OCF (Operativo)"
                  fill="#16a34a" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="icf" 
                  name="ICF (Inversión)"
                  fill="#f59e0b" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="fcf" 
                  name="FCF (Libre)"
                  fill="#dc2626" 
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cashOnHand" 
                  name="Cash on Hand"
                  stroke="#005E8A" 
                  strokeWidth={3}
                  dot={{ fill: '#005E8A', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">FCF Acumulado ({yearRange[1]} años)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatValue(summaryMetrics.fcfAcumulado)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CAPEX Total</p>
                <p className="text-2xl font-bold text-warning">
                  {formatValue(summaryMetrics.capexTotal)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash Final</p>
                <p className="text-2xl font-bold text-primary">
                  {formatValue(summaryMetrics.cashFinal)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}