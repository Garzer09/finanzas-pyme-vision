import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Lightbulb, TrendingUp } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'
import { useInflationData } from '@/hooks/useInflationData'
import { applyInflationToProjections } from '@/utils/inflationAdjustments'
import { useProjections } from '@/hooks/useProjections'
import { InflationDataCard } from '@/components/projections/InflationDataCard'

interface PLProyectadoTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function PLProyectadoTab({ scenario, yearRange, unit, includeInflation }: PLProyectadoTabProps) {
  const { getAverageInflation } = useInflationData({ 
    region: 'EU', 
    yearRange: [new Date().getFullYear(), new Date().getFullYear() + yearRange[1]] 
  })
  
  const { plData } = useProjections(scenario, yearRange)
  const baseChartData = plData.map((item, index) => ({
    year: index,
    ingresos: item.ingresos,
    costes: item.costes,
    ebitda: item.ebitda,
    margenEbitda: item.margenEbitda,
  }))

  // Apply inflation adjustments if enabled
  const chartData = includeInflation ? 
    applyInflationToProjections(baseChartData, {
      includeInflation: true,
      customRates: {
        [new Date().getFullYear() + 1]: getAverageInflation(),
        [new Date().getFullYear() + 2]: getAverageInflation(),
        [new Date().getFullYear() + 3]: getAverageInflation(),
        [new Date().getFullYear() + 4]: getAverageInflation(),
        [new Date().getFullYear() + 5]: getAverageInflation(),
      }
    }).map((item, index) => ({ ...item, year: `A${index}` })) :
    baseChartData.map((item, index) => ({ ...item, year: `A${index}` }))

  const tableData = (() => {
    const pad = (arr: number[]) => {
      const res = [...arr]
      while (res.length < 6) res.push(0)
      return res
    }
    const ingresos = pad(plData.map(d => d.ingresos))
    const costes = pad(plData.map(d => -d.costes))
    const ebitda = pad(plData.map(d => d.ebitda))
    const amort = pad(plData.map((_, idx) => Math.round((plData[idx]?.ingresos || 0) * 0.02)))
    const ebit = ebitda.map((v, i) => v - amort[i])
    const gastosFin = pad(plData.map((_, idx) => -Math.round(ebitda[idx] * 0.05)))
    const bai = ebit.map((v, i) => v + gastosFin[i])
    const impuestos = bai.map(v => -Math.round(Math.max(0, v) * 0.25))
    const bdi = bai.map((v, i) => v + impuestos[i])
    return [
      { concepto: 'Ingresos por Ventas', a0: ingresos[0], a1: ingresos[1], a2: ingresos[2], a3: ingresos[3], a4: ingresos[4], a5: ingresos[5] },
      { concepto: 'Coste de Ventas', a0: costes[0], a1: costes[1], a2: costes[2], a3: costes[3], a4: costes[4], a5: costes[5] },
      { concepto: 'EBITDA', a0: ebitda[0], a1: ebitda[1], a2: ebitda[2], a3: ebitda[3], a4: ebitda[4], a5: ebitda[5] },
      { concepto: 'Amortizaciones', a0: -amort[0], a1: -amort[1], a2: -amort[2], a3: -amort[3], a4: -amort[4], a5: -amort[5] },
      { concepto: 'EBIT', a0: ebit[0], a1: ebit[1], a2: ebit[2], a3: ebit[3], a4: ebit[4], a5: ebit[5] },
      { concepto: 'Gastos Financieros', a0: gastosFin[0], a1: gastosFin[1], a2: gastosFin[2], a3: gastosFin[3], a4: gastosFin[4], a5: gastosFin[5] },
      { concepto: 'BAI', a0: bai[0], a1: bai[1], a2: bai[2], a3: bai[3], a4: bai[4], a5: bai[5] },
      { concepto: 'Impuestos (25%)', a0: impuestos[0], a1: impuestos[1], a2: impuestos[2], a3: impuestos[3], a4: impuestos[4], a5: impuestos[5] },
      { concepto: 'BDI', a0: bdi[0], a1: bdi[1], a2: bdi[2], a3: bdi[3], a4: bdi[4], a5: bdi[5] },
    ]
  })()

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: chartData,
    activeTab: 'pl-proyectado'
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
                {entry.name === 'Margen EBITDA' ? `${entry.value}%` : formatValue(entry.value)}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const handleExportExcel = () => {
    // Implementar export a Excel
    console.log('Exportando P&G a Excel...')
  }

  return (
    <div className="space-y-6">
      {/* Inflation Data Card */}
      <InflationDataCard 
        includeInflation={includeInflation}
        yearRange={yearRange}
      />

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
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolución P&G Proyectado
            {includeInflation && (
              <Badge variant="secondary" className="text-xs">
                Con inflación BCE
              </Badge>
            )}
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
                  dataKey="ingresos" 
                  name="Ingresos"
                  fill="#005E8A" 
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="costes" 
                  name="Costes"
                  fill="#dc2626" 
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="margenEbitda" 
                  name="Margen EBITDA"
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuenta P&G Detallada</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExcel}
            className="gap-2"
            aria-label="Descargar tabla en Excel"
          >
            <Download className="h-4 w-4" />
            Descargar Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-semibold">Concepto</TableHead>
                  <TableHead className="text-right font-semibold">Año 0</TableHead>
                  <TableHead className="text-right font-semibold">Año 1</TableHead>
                  <TableHead className="text-right font-semibold">Año 2</TableHead>
                  <TableHead className="text-right font-semibold">Año 3</TableHead>
                  <TableHead className="text-right font-semibold">Año 4</TableHead>
                  <TableHead className="text-right font-semibold">Año 5</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={index} className={row.concepto.includes('EBITDA') ? 'bg-primary/5 font-semibold' : ''}>
                    <TableCell className="font-medium">{row.concepto}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a0)}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a1)}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a2)}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a3)}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a4)}</TableCell>
                    <TableCell className="text-right">{formatValue(row.a5)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}