import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Lightbulb, TrendingUp, Activity, Shield, DollarSign } from 'lucide-react'
import { useProjectionInsights } from '@/hooks/useProjectionInsights'

interface RatiosTabProps {
  scenario: 'base' | 'optimista' | 'pesimista'
  yearRange: [number, number]
  unit: 'k€' | 'm€' | '%'
  includeInflation: boolean
}

export function RatiosTab({ scenario, yearRange, unit, includeInflation }: RatiosTabProps) {
  // Mock data - en producción vendría de API/Supabase
  const rentabilidadData = [
    { year: 'A0', roe: 12.5, roa: 8.3, roic: 15.2 },
    { year: 'A1', roe: 13.8, roa: 9.1, roic: 16.4 },
    { year: 'A2', roe: 15.2, roa: 9.8, roic: 17.8 },
    { year: 'A3', roe: 16.1, roa: 10.4, roic: 18.5 },
    { year: 'A4', roe: 17.3, roa: 11.2, roic: 19.7 },
    { year: 'A5', roe: 18.1, roa: 11.8, roic: 20.3 }
  ].slice(0, yearRange[1] + 1)

  const liquidezData = [
    { year: 'A0', currentRatio: 1.8, quickRatio: 1.2, cashRatio: 0.4 },
    { year: 'A1', currentRatio: 2.1, quickRatio: 1.4, cashRatio: 0.6 },
    { year: 'A2', currentRatio: 2.3, quickRatio: 1.6, cashRatio: 0.8 },
    { year: 'A3', currentRatio: 2.5, quickRatio: 1.7, cashRatio: 0.9 },
    { year: 'A4', currentRatio: 2.8, quickRatio: 1.9, cashRatio: 1.1 },
    { year: 'A5', currentRatio: 3.0, quickRatio: 2.1, cashRatio: 1.3 }
  ].slice(0, yearRange[1] + 1)

  const solvenciaData = [
    { year: 'A0', debtToEquity: 2.8, debtToAssets: 0.65, timesInterest: 12.6 },
    { year: 'A1', debtToEquity: 2.5, debtToAssets: 0.62, timesInterest: 13.6 },
    { year: 'A2', debtToEquity: 2.2, debtToAssets: 0.58, timesInterest: 14.8 },
    { year: 'A3', debtToEquity: 1.9, debtToAssets: 0.54, timesInterest: 15.3 },
    { year: 'A4', debtToEquity: 1.7, debtToAssets: 0.51, timesInterest: 16.5 },
    { year: 'A5', debtToEquity: 1.5, debtToAssets: 0.48, timesInterest: 17.8 }
  ].slice(0, yearRange[1] + 1)

  const endeudamientoData = [
    { year: 'A0', deudaTotal: 1800, cobertura: 14.4, dscr: 1.8 },
    { year: 'A1', deudaTotal: 1650, cobertura: 15.4, dscr: 2.1 },
    { year: 'A2', deudaTotal: 1480, cobertura: 16.3, dscr: 2.3 },
    { year: 'A3', deudaTotal: 1290, cobertura: 17.2, dscr: 2.6 },
    { year: 'A4', deudaTotal: 1080, cobertura: 18.9, dscr: 2.9 },
    { year: 'A5', deudaTotal: 850, cobertura: 19.8, dscr: 3.2 }
  ].slice(0, yearRange[1] + 1)

  const insights = useProjectionInsights({
    scenario,
    yearRange,
    data: { rentabilidadData, liquidezData, solvenciaData, endeudamientoData },
    activeTab: 'ratios'
  })

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
                {typeof entry.value === 'number' && entry.name !== 'Deuda Total' 
                  ? `${entry.value.toFixed(1)}${entry.name.includes('Ratio') || entry.name.includes('DSCR') ? 'x' : '%'}`
                  : `€${entry.value}K`
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

      {/* Ratios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rentabilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Ratios de Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rentabilidadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="roe" name="ROE" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="roa" name="ROA" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="roic" name="ROIC" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Liquidez */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Ratios de Liquidez
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liquidezData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}x`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="currentRatio" name="Current Ratio" stroke="#005E8A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="quickRatio" name="Quick Ratio" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cashRatio" name="Cash Ratio" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Solvencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              Ratios de Solvencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={solvenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="debtToEquity" name="Debt/Equity" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="debtToAssets" name="Debt/Assets" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="timesInterest" name="Times Interest" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Endeudamiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-destructive" />
              Evolución del Endeudamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={endeudamientoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(value) => `€${value}K`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}x`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="deudaTotal" name="Deuda Total" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="dscr" name="DSCR" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}