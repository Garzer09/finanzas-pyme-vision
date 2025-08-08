import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, Building2 } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'
import { useProjections } from '@/hooks/useProjections'

interface BalanceProyectadoTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function BalanceProyectadoTab({ scenario, yearRange, unit, includeInflation }: BalanceProyectadoTabProps) {
  const { balanceData } = useProjections(scenario, yearRange)
  const activoData = balanceData.activo.slice(0, yearRange[1] + 1)
  const financiacionData = balanceData.financiacion.slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: { activoData, financiacionData },
    activeTab: 'balance-proyectado'
  })

  const formatValue = (value: number) => {
    if (unit === 'm€') return `€${(value / 1000).toFixed(1)}M`
    if (unit === 'k€') return `€${value}K`
    return `${value}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
      return (
        <div className="bg-white border border-border rounded-lg p-3 shadow-lg" role="tooltip">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm">
              <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}: </span>
              <span className="font-medium text-primary">
                {formatValue(entry.value)} ({((entry.value / total) * 100).toFixed(1)}%)
              </span>
            </p>
          ))}
          <hr className="my-1 border-border" />
          <p className="text-sm font-semibold">
            <span className="text-muted-foreground">Total: </span>
            <span className="text-primary">{formatValue(total)}</span>
          </p>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución del Activo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Evolución del Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="inmovilizadoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005E8A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#005E8A" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="circulanteGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="tesoreriaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="inmovilizado"
                    name="Inmovilizado"
                    stackId="1"
                    stroke="#005E8A"
                    fill="url(#inmovilizadoGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="circulante"
                    name="Circulante"
                    stackId="1"
                    stroke="#16a34a"
                    fill="url(#circulanteGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tesoreria"
                    name="Tesorería"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#tesoreriaGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estructura de Financiación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-success" />
              Estructura de Financiación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financiacionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="patrimonioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="deudaLPGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="deudaCPGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="patrimonio"
                    name="Patrimonio"
                    stackId="1"
                    stroke="#16a34a"
                    fill="url(#patrimonioGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="deudaLP"
                    name="Deuda L/P"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#deudaLPGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="deudaCP"
                    name="Deuda C/P"
                    stackId="1"
                    stroke="#dc2626"
                    fill="url(#deudaCPGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activo A5</p>
                <p className="text-2xl font-bold text-primary">{formatValue(4410)}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ratio Liquidez</p>
                <p className="text-2xl font-bold text-success">3.0x</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Apalancamiento</p>
                <p className="text-2xl font-bold text-warning">1.7x</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crecimiento</p>
                <p className="text-2xl font-bold text-primary">+175%</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}