import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Lightbulb, TrendingUp } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'
import { useInflationData } from '@/hooks/useInflationData'
import { applyInflationToProjections } from '@/utils/inflationAdjustments'

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

  // Mock data - en producción vendría de API/Supabase
  const baseChartData = [
    { year: 0, ingresos: 1200, costes: 840, ebitda: 360, margenEbitda: 30 },
    { year: 1, ingresos: 1350, costes: 918, ebitda: 432, margenEbitda: 32 },
    { year: 2, ingresos: 1520, costes: 1013, ebitda: 507, margenEbitda: 33.4 },
    { year: 3, ingresos: 1720, costes: 1134, ebitda: 586, margenEbitda: 34.1 },
    { year: 4, ingresos: 1950, costes: 1268, ebitda: 682, margenEbitda: 35 },
    { year: 5, ingresos: 2200, costes: 1408, ebitda: 792, margenEbitda: 36 }
  ].slice(0, yearRange[1] + 1)

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

  const tableData = [
    { concepto: 'Ingresos por Ventas', a0: 1200, a1: 1350, a2: 1520, a3: 1720, a4: 1950, a5: 2200 },
    { concepto: 'Coste de Ventas', a0: -600, a1: -675, a2: -760, a3: -860, a4: -975, a5: -1100 },
    { concepto: 'Margen Bruto', a0: 600, a1: 675, a2: 760, a3: 860, a4: 975, a5: 1100 },
    { concepto: 'Gastos Operativos', a0: -240, a1: -243, a2: -253, a3: -274, a4: -293, a5: -308 },
    { concepto: 'EBITDA', a0: 360, a1: 432, a2: 507, a3: 586, a4: 682, a5: 792 },
    { concepto: 'Amortizaciones', a0: -45, a1: -52, a2: -58, a3: -65, a4: -73, a5: -82 },
    { concepto: 'EBIT', a0: 315, a1: 380, a2: 449, a3: 521, a4: 609, a5: 710 },
    { concepto: 'Gastos Financieros', a0: -25, a1: -28, a2: -31, a3: -34, a4: -37, a5: -40 },
    { concepto: 'BAI', a0: 290, a1: 352, a2: 418, a3: 487, a4: 572, a5: 670 },
    { concepto: 'Impuestos (25%)', a0: -73, a1: -88, a2: -105, a3: -122, a4: -143, a5: -168 },
    { concepto: 'BDI', a0: 217, a1: 264, a2: 313, a3: 365, a4: 429, a5: 502 }
  ]

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