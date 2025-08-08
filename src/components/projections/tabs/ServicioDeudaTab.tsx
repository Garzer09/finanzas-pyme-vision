import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, AlertTriangle } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'
import { useProjections } from '@/hooks/useProjections'

interface ServicioDeudaTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function ServicioDeudaTab({ scenario, yearRange, unit, includeInflation }: ServicioDeudaTabProps) {
  const { plData, ratiosData } = useProjections(scenario, yearRange)
  const chartData = plData.map((pl, idx) => {
    // Estimar servicio de deuda a partir de ratios de solvencia y deuda total proyectada
    const deudaTotal = ratiosData.endeudamientoData[idx]?.deudaTotal || 0
    const intereses = Math.round(deudaTotal * 0.05)
    const principal = Math.round(deudaTotal * 0.08)
    const servicioDeuda = intereses + principal
    const dscr = intereses > 0 ? (pl.ebitda / intereses) : 0
    return {
      year: pl.year,
      servicioDeuda,
      principal,
      intereses,
      dscr,
      ebitda: pl.ebitda
    }
  }).slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: chartData,
    activeTab: 'servicio-deuda'
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
                {entry.name === 'DSCR' ? `${entry.value.toFixed(1)}x` : formatValue(entry.value)}
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
            <AlertTriangle className="h-5 w-5 text-warning" />
            Servicio de Deuda y Cobertura (DSCR)
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
                  tickFormatter={(value) => `${value.toFixed(1)}x`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="principal" 
                  name="Principal"
                  fill="#dc2626" 
                  stackId="deuda"
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="intereses" 
                  name="Intereses"
                  fill="#f59e0b" 
                  stackId="deuda"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="dscr" 
                  name="DSCR"
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* DSCR Warning Line */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Línea de seguridad DSCR:</strong> 1.25x mínimo requerido por entidades financieras
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DSCR A5</p>
                <p className="text-2xl font-bold text-success">3.4x</p>
                <p className="text-xs text-muted-foreground">+1.4x vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servicio Total A5</p>
                <p className="text-2xl font-bold text-warning">{formatValue(235)}</p>
                <p className="text-xs text-muted-foreground">+31% vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% sobre EBITDA</p>
                <p className="text-2xl font-bold text-primary">29.7%</p>
                <p className="text-xs text-muted-foreground">-20pp vs A0</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capacidad Adicional</p>
                <p className="text-2xl font-bold text-success">{formatValue(557)}</p>
                <p className="text-xs text-muted-foreground">EBITDA disponible</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Amortización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-semibold text-foreground">Año</th>
                  <th className="text-right p-2 font-semibold text-foreground">EBITDA</th>
                  <th className="text-right p-2 font-semibold text-foreground">Principal</th>
                  <th className="text-right p-2 font-semibold text-foreground">Intereses</th>
                  <th className="text-right p-2 font-semibold text-foreground">Total Servicio</th>
                  <th className="text-right p-2 font-semibold text-foreground">DSCR</th>
                  <th className="text-right p-2 font-semibold text-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.year}</td>
                    <td className="p-2 text-right">{formatValue(row.ebitda)}</td>
                    <td className="p-2 text-right">{formatValue(row.principal)}</td>
                    <td className="p-2 text-right">{formatValue(row.intereses)}</td>
                    <td className="p-2 text-right font-semibold">{formatValue(row.servicioDeuda)}</td>
                    <td className="p-2 text-right font-bold">{row.dscr.toFixed(1)}x</td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.dscr >= 2.0 ? 'bg-success/10 text-success' :
                        row.dscr >= 1.25 ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {row.dscr >= 2.0 ? 'Excelente' : row.dscr >= 1.25 ? 'Aceptable' : 'Riesgo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}