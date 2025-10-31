import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Lightbulb, Users } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'

interface VentasSegmentosTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function VentasSegmentosTab({ scenario, yearRange, unit, includeInflation }: VentasSegmentosTabProps) {
  // Mock data - ventas por segmento
  const ventasData = [
    { year: 'A0', premium: 408, estandar: 600, basicos: 480, servicios: 312 },
    { year: 'A1', premium: 459, estandar: 675, basicos: 540, servicios: 351 },
    { year: 'A2', premium: 517, estandar: 761, basicos: 609, servicios: 395 },
    { year: 'A3', premium: 582, estandar: 858, basicos: 687, servicios: 445 },
    { year: 'A4', premium: 655, estandar: 968, basicos: 775, servicios: 502 },
    { year: 'A5', premium: 737, estandar: 1092, basicos: 875, servicios: 566 }
  ].slice(0, yearRange[1] + 1)

  // Mock data - márgenes por segmento
  const margenData = [
    { year: 'A0', premium: 35, estandar: 25, basicos: 15, servicios: 45 },
    { year: 'A1', premium: 36, estandar: 26, basicos: 16, servicios: 46 },
    { year: 'A2', premium: 37, estandar: 27, basicos: 17, servicios: 47 },
    { year: 'A3', premium: 38, estandar: 28, basicos: 18, servicios: 48 },
    { year: 'A4', premium: 39, estandar: 29, basicos: 19, servicios: 49 },
    { year: 'A5', premium: 40, estandar: 30, basicos: 20, servicios: 50 }
  ].slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: { ventasData, margenData },
    activeTab: 'ventas-segmentos'
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
                {entry.payload && typeof entry.payload.premium !== 'undefined' 
                  ? formatValue(entry.value) 
                  : `${entry.value}%`
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de Ventas por Segmento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Evolución Ventas por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ventasData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005E8A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#005E8A" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="estandarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="basicosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="serviciosGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatValue} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="premium"
                    name="Premium"
                    stackId="1"
                    stroke="#005E8A"
                    fill="url(#premiumGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="estandar"
                    name="Estándar"
                    stackId="1"
                    stroke="#16a34a"
                    fill="url(#estandarGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="basicos"
                    name="Básicos"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#basicosGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="servicios"
                    name="Servicios"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="url(#serviciosGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolución de Márgenes por Segmento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-success" />
              Evolución Márgenes por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={margenData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="premium"
                    name="Premium"
                    stroke="#005E8A"
                    strokeWidth={3}
                    dot={{ fill: '#005E8A', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="estandar"
                    name="Estándar"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="basicos"
                    name="Básicos"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="servicios"
                    name="Servicios"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Premium A5</p>
                <p className="text-2xl font-bold text-primary">{formatValue(737)}</p>
                <p className="text-xs text-success">+81% vs A0 | 40% margen</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estándar A5</p>
                <p className="text-2xl font-bold text-success">{formatValue(1092)}</p>
                <p className="text-xs text-success">+82% vs A0 | 30% margen</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Básicos A5</p>
                <p className="text-2xl font-bold text-warning">{formatValue(875)}</p>
                <p className="text-xs text-warning">+82% vs A0 | 20% margen</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servicios A5</p>
                <p className="text-2xl font-bold text-purple-600">{formatValue(566)}</p>
                <p className="text-xs text-purple-600">+81% vs A0 | 50% margen</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Estratégico por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Oportunidades de Crecimiento</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Segmento Premium</p>
                    <p className="text-xs text-muted-foreground">Mayor crecimiento (81%) con margen más alto (40%). Continuar inversión en calidad y diferenciación.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Servicios</p>
                    <p className="text-xs text-muted-foreground">Margen más alto (50%) con potencial de expansión. Desarrollar ofertas complementarias.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Eficiencia Operativa</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Estándar</p>
                    <p className="text-xs text-muted-foreground">Volumen más alto con margen mejorado (30%). Optimizar procesos para mantener competitividad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Básicos</p>
                    <p className="text-xs text-muted-foreground">Margen más bajo (20%) pero volumen estable. Evaluar automatización para reducir costes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}