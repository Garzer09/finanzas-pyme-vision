import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WaterfallChart } from '@/components/ui/waterfall-chart';
import { useFinancialData } from '@/hooks/useFinancialData';

export const EvolutionChartsSection: React.FC = () => {
  const { data, loading } = useFinancialData();

  // Datos simulados para los gráficos de evolución
  const evolutionData = [
    {
      period: '2022',
      facturacion: 2100000,
      margenEBITDA: 12.5,
      beneficioNeto: 180000
    },
    {
      period: '2023',
      facturacion: 2450000,
      margenEBITDA: 14.2,
      beneficioNeto: 220000
    },
    {
      period: '2024 (Proy.)',
      facturacion: 2680000,
      margenEBITDA: 15.8,
      beneficioNeto: 285000
    },
    {
      period: '2025 (Proy.)',
      facturacion: 2920000,
      margenEBITDA: 16.5,
      beneficioNeto: 320000
    },
    {
      period: '2026 (Proy.)',
      facturacion: 3150000,
      margenEBITDA: 17.2,
      beneficioNeto: 365000
    }
  ];

  // Datos para gráfico de cascada P&G
  const waterfallPGData = [
    { name: 'Facturación', value: 2450000, type: 'positive' as const },
    { name: 'Coste Ventas', value: -1470000, type: 'negative' as const },
    { name: 'Margen Bruto', value: 980000, type: 'total' as const },
    { name: 'Gastos Operativos', value: -632000, type: 'negative' as const },
    { name: 'EBITDA', value: 348000, type: 'total' as const },
    { name: 'Amortizaciones', value: -85000, type: 'negative' as const },
    { name: 'EBIT', value: 263000, type: 'total' as const },
    { name: 'Gastos Financieros', value: -43000, type: 'negative' as const },
    { name: 'Beneficio Neto', value: 220000, type: 'positive' as const }
  ];

  // Datos para estructura de balance
  const balanceData = [
    {
      category: 'Activo',
      corriente: 850000,
      noCorriente: 1650000,
      total: 2500000
    },
    {
      category: 'Pasivo + PN',
      corriente: 420000,
      noCorriente: 780000,
      patrimonioNeto: 1300000,
      total: 2500000
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="dashboard-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-light-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-steel-blue-dark mb-4">
        Gráficos de Evolución y Comparativas
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolución de Ingresos y Rentabilidad */}
        <Card className="dashboard-card col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-steel-blue-dark">Evolución de Ingresos y Rentabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(210 40% 45%)"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(210 40% 45%)"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  stroke="hsl(210 40% 45%)"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'facturacion') return [`${(Number(value) / 1000000).toFixed(1)}M€`, 'Facturación'];
                    if (name === 'margenEBITDA') return [`${value}%`, 'Margen EBITDA'];
                    if (name === 'beneficioNeto') return [`${(Number(value) / 1000).toFixed(0)}K€`, 'Beneficio Neto'];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 100%)',
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="facturacion" 
                  fill="hsl(210 44% 45%)" 
                  name="Facturación"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="margenEBITDA" 
                  stroke="hsl(174 50% 40%)" 
                  strokeWidth={3}
                  name="Margen EBITDA (%)"
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="beneficioNeto" 
                  stroke="hsl(157 69% 38%)" 
                  strokeWidth={3}
                  name="Beneficio Neto"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Cascada P&G */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-steel-blue-dark">Cascada Cuenta de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <WaterfallChart data={waterfallPGData} />
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Estructura de Balance */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-steel-blue-dark">Estructura de Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-[300px]">
              {/* Activo */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-steel-blue-dark text-center">ACTIVO</h4>
                <ResponsiveContainer width="100%" height="90%">
                  <ComposedChart
                    data={[balanceData[0]]}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <YAxis type="category" dataKey="category" hide />
                    <XAxis 
                      type="number" 
                      hide
                      domain={[0, 2500000]}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(Number(value) / 1000000).toFixed(1)}M€`]}
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(220 13% 91%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="corriente" stackId="a" fill="hsl(210 44% 45%)" name="Activo Corriente" />
                    <Bar dataKey="noCorriente" stackId="a" fill="hsl(174 50% 40%)" name="Activo No Corriente" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Pasivo + PN */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-steel-blue-dark text-center">PASIVO + PN</h4>
                <ResponsiveContainer width="100%" height="90%">
                  <ComposedChart
                    data={[balanceData[1]]}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <YAxis type="category" dataKey="category" hide />
                    <XAxis 
                      type="number" 
                      hide
                      domain={[0, 2500000]}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(Number(value) / 1000000).toFixed(1)}M€`]}
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(220 13% 91%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="patrimonioNeto" stackId="b" fill="hsl(157 69% 38%)" name="Patrimonio Neto" />
                    <Bar dataKey="noCorriente" stackId="b" fill="hsl(210 44% 45%)" name="Pasivo No Corriente" />
                    <Bar dataKey="corriente" stackId="b" fill="hsl(174 50% 40%)" name="Pasivo Corriente" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};