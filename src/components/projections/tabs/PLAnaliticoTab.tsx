import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, BarChart3 } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'

interface PLAnaliticoTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function PLAnaliticoTab({ scenario, yearRange, unit, includeInflation }: PLAnaliticoTabProps) {
  // Mock data - en producción vendría de API/Supabase
  const chartData = [
    { year: 'A0', costesVariables: 720, costesStructura: 240, contribucion: 480, margenContribucion: 40 },
    { year: 'A1', costesVariables: 810, costesStructura: 260, contribucion: 540, margenContribucion: 40 },
    { year: 'A2', costesVariables: 913, costesStructura: 278, contribucion: 611, margenContribucion: 42 },
    { year: 'A3', costesVariables: 1024, costesStructura: 298, contribucion: 696, margenContribucion: 43.5 },
    { year: 'A4', costesVariables: 1147, costesStructura: 320, contribucion: 803, margenContribucion: 45 },
    { year: 'A5', costesVariables: 1287, costesStructura: 343, contribucion: 913, margenContribucion: 46.5 }
  ].slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: chartData,
    activeTab: 'pl-analitico'
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
                {entry.name === 'Margen Contribución' ? `${entry.value}%` : formatValue(entry.value)}
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
            <BarChart3 className="h-5 w-5 text-primary" />
            P&G Analítico - Estructura de Costes y Contribución
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="costesVariables" 
                  name="Costes Variables"
                  fill="#dc2626" 
                  stackId="costes"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="costesStructura" 
                  name="Costes Estructura"
                  fill="#f59e0b" 
                  stackId="costes"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="contribucion" 
                  name="Contribución"
                  fill="#16a34a" 
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="margenContribucion" 
                  name="Margen Contribución"
                  stroke="#005E8A" 
                  strokeWidth={3}
                  dot={{ fill: '#005E8A', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contribución A5</p>
                <p className="text-2xl font-bold text-success">{formatValue(913)}</p>
                <p className="text-xs text-muted-foreground">+90% vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margen Contribución A5</p>
                <p className="text-2xl font-bold text-primary">46.5%</p>
                <p className="text-xs text-muted-foreground">+6.5pp vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eficiencia Operativa</p>
                <p className="text-2xl font-bold text-warning">84.2%</p>
                <p className="text-xs text-muted-foreground">Costes/Ingresos A5</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}