import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WaterfallChart } from '@/components/ui/waterfall-chart';
import { TrendingUp } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';


export const EvolutionChartsSection: React.FC = () => {
  const { data, loading, hasRealData, getMultiYearData, safeNumber, getLatestData } = useFinancialData();

  // Función para validar y limpiar datos antes de pasarlos a Recharts
  const validateChartData = (data: any[]): any[] => {
    return data.map(item => {
      const cleanItem: any = {};
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'number') {
          cleanItem[key] = safeNumber(item[key], 0);
        } else {
          cleanItem[key] = item[key];
        }
      });
      return cleanItem;
    });
  };

  // Get real multi-year data or fallback to demo data
  const getRealEvolutionData = () => {
    if (!hasRealData) {
      // Demo data when no real data available
      return [
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
        }
      ];
    }

    // Real data from database
    const pygData = getMultiYearData('estado_pyg');
    return pygData.map(yearData => ({
      period: yearData.year,
      facturacion: safeNumber(yearData.ventas, 0),
      margenEBITDA: yearData.ventas ? 
        ((safeNumber(yearData.ebitda, 0) / safeNumber(yearData.ventas, 1)) * 100) : 0,
      beneficioNeto: safeNumber(yearData.resultado_neto, 0)
    }));
  };

  const evolutionData = validateChartData(getRealEvolutionData());

  // Calculate dynamic domain for balance charts based on real data
  const getBalanceChartDomain = () => {
    if (balanceData.length === 0) return [0, 2500000];
    const maxValue = Math.max(
      ...balanceData.map(item => item.total || 0)
    );
    return [0, Math.ceil(maxValue * 1.1)]; // Add 10% padding
  };

  const balanceChartDomain = getBalanceChartDomain();

  // Get real waterfall P&G data from database or fallback to demo
  const getRealWaterfallData = () => {
    if (!hasRealData) {
      // Demo data when no real data available
      return [
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
    }

    // Real data from database
    const latestPL = getLatestData('estado_pyg');
    if (!latestPL?.data_content) return [];

    const content = latestPL.data_content;
    
    // Build waterfall from real P&G data
    const facturacion = safeNumber(content.ingresos_explotacion || content.ventas || content.cifra_negocios, 0);
    const costeVentas = Math.abs(safeNumber(content.aprovisionamientos || content.compras || content.consumos, 0)) * -1;
    const margenBruto = facturacion + costeVentas;
    const gastosOperativos = Math.abs(safeNumber(content.gastos_personal + content.otros_gastos_explotacion, 0)) * -1;
    const ebitda = margenBruto + gastosOperativos;
    const amortizaciones = Math.abs(safeNumber(content.amortizaciones || content.dotaciones_amortizacion, 0)) * -1;
    const ebit = ebitda + amortizaciones;
    const gastosFinancieros = Math.abs(safeNumber(content.gastos_financieros, 0)) * -1;
    const beneficioNeto = safeNumber(content.resultado_neto || content.resultado_ejercicio, 0);

    return [
      { name: 'Facturación', value: facturacion, type: 'positive' as const },
      { name: 'Coste Ventas', value: costeVentas, type: 'negative' as const },
      { name: 'Margen Bruto', value: margenBruto, type: 'total' as const },
      { name: 'Gastos Operativos', value: gastosOperativos, type: 'negative' as const },
      { name: 'EBITDA', value: ebitda, type: 'total' as const },
      { name: 'Amortizaciones', value: amortizaciones, type: 'negative' as const },
      { name: 'EBIT', value: ebit, type: 'total' as const },
      { name: 'Gastos Financieros', value: gastosFinancieros, type: 'negative' as const },
      { name: 'Beneficio Neto', value: beneficioNeto, type: 'positive' as const }
    ];
  };

  const waterfallPGData = validateChartData(getRealWaterfallData());

  // Get real balance structure data from database or fallback to demo
  const getRealBalanceData = () => {
    if (!hasRealData) {
      // Demo data when no real data available
      return [
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
    }

    // Real data from database
    const latestBalance = getLatestData('balance_situacion');
    if (!latestBalance?.data_content) return [];

    const content = latestBalance.data_content;
    
    // Extract balance sheet components
    const activoCorriente = safeNumber(content.activo_corriente, 0);
    const activoNoCorriente = safeNumber(content.activo_no_corriente || content.inmovilizado, 0);
    const totalActivo = activoCorriente + activoNoCorriente;
    
    const pasivoCorriente = safeNumber(content.pasivo_corriente || content.acreedores_corto_plazo, 0);
    const pasivoNoCorriente = safeNumber(content.pasivo_no_corriente || content.acreedores_largo_plazo, 0);
    const patrimonioNeto = safeNumber(content.patrimonio_neto || content.fondos_propios, 0);
    const totalPasivoPn = pasivoCorriente + pasivoNoCorriente + patrimonioNeto;

    return [
      {
        category: 'Activo',
        corriente: activoCorriente,
        noCorriente: activoNoCorriente,
        total: totalActivo
      },
      {
        category: 'Pasivo + PN',
        corriente: pasivoCorriente,
        noCorriente: pasivoNoCorriente,
        patrimonioNeto: patrimonioNeto,
        total: totalPasivoPn
      }
    ];
  };

  const balanceData = validateChartData(getRealBalanceData());

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

  // Si no hay datos reales, mostrar mensaje informativo
  if (!hasRealData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-steel-blue-dark">
            Gráficos de Evolución y Comparativas
          </h3>
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
            Sin datos históricos
          </Badge>
        </div>
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Análisis histórico no disponible</h3>
          <p className="text-gray-500 mb-6">
            Los gráficos de evolución se mostrarán una vez que cargues datos financieros históricos
          </p>
          <Badge 
            onClick={() => window.location.href = '/excel-upload'} 
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            📁 Cargar Datos Históricos
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-steel-blue-dark">
          Gráficos de Evolución y Comparativas
        </h3>
        <Badge variant={hasRealData ? 'default' : 'outline'} className="text-xs">
          {hasRealData ? '📊 Datos Reales' : '🔍 Datos Demo'}
        </Badge>
      </div>
      
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
                    const safeValue = safeNumber(value, 0);
                    if (name === 'facturacion') return [`${(safeValue / 1000000).toFixed(1)}M€`, 'Facturación'];
                    if (name === 'margenEBITDA') return [`${safeValue.toFixed(1)}%`, 'Margen EBITDA'];
                    if (name === 'beneficioNeto') return [`${(safeValue / 1000).toFixed(0)}K€`, 'Beneficio Neto'];
                    return [safeValue, name];
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
                      domain={balanceChartDomain}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(safeNumber(value, 0) / 1000000).toFixed(1)}M€`]}
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
                      domain={balanceChartDomain}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(safeNumber(value, 0) / 1000000).toFixed(1)}M€`]}
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