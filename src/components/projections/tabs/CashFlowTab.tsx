import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, Activity } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'

interface CashFlowTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function CashFlowTab({ scenario, yearRange, unit, includeInflation }: CashFlowTabProps) {
  // Mock data - en producción vendría de API/Supabase
  const chartData = [
    { year: 'A0', ocf: 290, icf: -150, fcf: 140, cashOnHand: 200 },
    { year: 'A1', ocf: 380, icf: -180, fcf: 200, cashOnHand: 400 },
    { year: 'A2', ocf: 450, icf: -200, fcf: 250, cashOnHand: 650 },
    { year: 'A3', ocf: 520, icf: -220, fcf: 300, cashOnHand: 950 },
    { year: 'A4', ocf: 610, icf: -240, fcf: 370, cashOnHand: 1320 },
    { year: 'A5', ocf: 710, icf: -260, fcf: 450, cashOnHand: 1770 }
  ].slice(0, yearRange[1] + 1)

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
                <p className="text-sm text-muted-foreground">FCF Acumulado (5 años)</p>
                <p className="text-2xl font-bold text-primary">€1.71M</p>
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
                <p className="text-2xl font-bold text-warning">€1.25M</p>
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
                <p className="text-2xl font-bold text-primary">€1.77M</p>
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