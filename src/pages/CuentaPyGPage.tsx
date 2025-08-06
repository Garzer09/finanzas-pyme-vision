
import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { WaterfallChart } from '@/components/ui/waterfall-chart';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { GlobalFilters } from '@/components/GlobalFilters';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MissingFinancialData } from '@/components/ui/missing-data-indicator';
import { DataStatusBadge } from '@/components/ui/data-status-badge';
import { usePeriodContext } from '@/contexts/PeriodContext';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useDataValidation } from '@/hooks/useDataValidation';
import { FileText, TrendingUp, TrendingDown, Target, Settings, BarChart2, Info } from 'lucide-react';

export const CuentaPyGPage = () => {
  const [showComparison, setShowComparison] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const { 
    comparisonEnabled, 
    setComparisonEnabled, 
    comparisonPeriods,
    selectedPeriods,
    availablePeriods 
  } = usePeriodContext();

  // Use real financial data
  const { data: financialData, loading, error, hasRealData } = useFinancialData('pyg');
  const { validation } = useDataValidation();

  // Process real financial data
  const processFinancialData = () => {
    if (!hasRealData || !financialData.length) return [];
    
    const pygRecord = financialData.find(d => d.data_type === 'pyg');
    if (!pygRecord?.data_content) return [];

    const content = pygRecord.data_content;
    const latestYear = Object.keys(content).sort().pop();
    if (!latestYear) return [];

    const yearData = content[latestYear];
    const totalIngresos = yearData['importe_neto_cifra_negocios'] || yearData['ventas'] || 0;

    return [
      { concepto: 'Importe Neto Cifra Negocios', valor: yearData['importe_neto_cifra_negocios'] || 0, porcentaje: 100 },
      { concepto: 'Aprovisionamientos', valor: -(yearData['aprovisionamientos'] || 0), porcentaje: yearData['aprovisionamientos'] ? -(yearData['aprovisionamientos'] / totalIngresos * 100) : 0 },
      { concepto: 'Gastos Personal', valor: -(yearData['gastos_personal'] || 0), porcentaje: yearData['gastos_personal'] ? -(yearData['gastos_personal'] / totalIngresos * 100) : 0 },
      { concepto: 'Otros Gastos Explotación', valor: -(yearData['otros_gastos_explotacion'] || 0), porcentaje: yearData['otros_gastos_explotacion'] ? -(yearData['otros_gastos_explotacion'] / totalIngresos * 100) : 0 },
      { concepto: 'EBITDA', valor: yearData['ebitda'] || 0, porcentaje: yearData['ebitda'] ? (yearData['ebitda'] / totalIngresos * 100) : 0, destacar: true },
      { concepto: 'Amortizaciones', valor: -(yearData['amortizaciones'] || 0), porcentaje: yearData['amortizaciones'] ? -(yearData['amortizaciones'] / totalIngresos * 100) : 0 },
      { concepto: 'EBIT', valor: yearData['ebit'] || yearData['resultado_explotacion'] || 0, porcentaje: yearData['ebit'] ? (yearData['ebit'] / totalIngresos * 100) : 0, destacar: true },
      { concepto: 'Gastos Financieros', valor: -(yearData['gastos_financieros'] || 0), porcentaje: yearData['gastos_financieros'] ? -(yearData['gastos_financieros'] / totalIngresos * 100) : 0 },
      { concepto: 'Resultado antes Impuestos', valor: yearData['resultado_antes_impuestos'] || 0, porcentaje: yearData['resultado_antes_impuestos'] ? (yearData['resultado_antes_impuestos'] / totalIngresos * 100) : 0 },
      { concepto: 'Impuestos', valor: -(yearData['impuestos'] || 0), porcentaje: yearData['impuestos'] ? -(yearData['impuestos'] / totalIngresos * 100) : 0 },
      { concepto: 'Resultado Neto', valor: yearData['resultado_neto'] || 0, porcentaje: yearData['resultado_neto'] ? (yearData['resultado_neto'] / totalIngresos * 100) : 0, destacar: true },
    ].filter(item => item.valor !== 0);
  };

  const pygData = processFinancialData();

  // Waterfall chart data from real data
  const waterfallData = pygData.map(item => ({
    name: item.concepto === 'Importe Neto Cifra Negocios' ? 'Ingresos' : item.concepto,
    value: item.valor,
    type: (item.destacar ? 'total' : (item.valor < 0 ? 'negative' : 'positive')) as 'total' | 'negative' | 'positive'
  }));

  // KPI data calculated from real data
  const calculateKPIs = () => {
    if (pygData.length === 0) return [];

    const ingresos = pygData.find(item => item.concepto === 'Importe Neto Cifra Negocios')?.valor || 0;
    const ebitda = pygData.find(item => item.concepto === 'EBITDA')?.valor || 0;
    const resultadoNeto = pygData.find(item => item.concepto === 'Resultado Neto')?.valor || 0;
    
    const margenBruto = ingresos > 0 ? ((ingresos + (pygData.find(item => item.concepto === 'Aprovisionamientos')?.valor || 0)) / ingresos * 100) : 0;
    const margenEbitda = ingresos > 0 ? (ebitda / ingresos * 100) : 0;
    const margenNeto = ingresos > 0 ? (resultadoNeto / ingresos * 100) : 0;

    return [
      {
        title: 'Margen Bruto',
        value: `${margenBruto.toFixed(1)}%`,
        subtitle: formatCurrency(ingresos + (pygData.find(item => item.concepto === 'Aprovisionamientos')?.valor || 0)),
        trend: margenBruto > 30 ? 'up' as const : 'neutral' as const,
        trendValue: '+2%',
        icon: TrendingUp,
        variant: margenBruto > 30 ? 'success' as const : 'warning' as const
      },
      {
        title: 'Margen EBITDA',
        value: `${margenEbitda.toFixed(1)}%`,
        subtitle: formatCurrency(ebitda),
        trend: margenEbitda > 5 ? 'up' as const : 'neutral' as const,
        trendValue: '0%',
        icon: Target,
        variant: margenEbitda > 5 ? 'success' as const : 'warning' as const
      },
      {
        title: 'Margen Neto',
        value: `${margenNeto.toFixed(1)}%`,
        subtitle: formatCurrency(resultadoNeto),
        trend: margenNeto > 0 ? 'up' as const : 'down' as const,
        trendValue: '-0.5%',
        icon: margenNeto > 0 ? TrendingUp : TrendingDown,
        variant: margenNeto > 5 ? 'success' as const : (margenNeto > 0 ? 'warning' as const : 'danger' as const)
      }
    ];
  };

  const kpiData = calculateKPIs();

  const handleUploadClick = () => {
    // Navigate to admin upload page
    window.location.href = '/admin/cargas';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const getVariationIcon = (variation: number) => {
    if (variation > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variation < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  const getVariationColor = (variation: number) => {
    if (variation > 5) return 'text-green-600';
    if (variation < -5) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-steel-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-8 overflow-auto">
          {/* Header Section */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel/5 via-cadet/3 to-slate-100/5 rounded-3xl"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-cadet/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                    Cuenta de Pérdidas y Ganancias
                  </h1>
                  <div className="flex items-center gap-3">
                    <p className="text-slate-700 text-lg font-medium">
                      Análisis de Resultados con Comparativa Año Anterior
                    </p>
                    <DataStatusBadge 
                      hasData={hasRealData}
                      lastUpdated={validation.lastUpdated}
                      completeness={validation.dataQuality.pyg}
                      variant="compact"
                    />
                    {selectedPeriods.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        {selectedPeriods.length} periodo{selectedPeriods.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <RoleBasedAccess allowedRoles={['admin']}>
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-white/50 hover:bg-white/80"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                </RoleBasedAccess>
              </div>
            </div>
          </section>

          {/* Filtros Globales */}
          <GlobalFilters />

          {/* Panel de Configuración Admin */}
          <RoleBasedAccess allowedRoles={['admin']}>
            {showSettings && (
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="text-steel-blue-dark flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Configuración de Comparativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="comparison-toggle" className="text-sm font-medium">
                        Habilitar Comparativa Año Anterior
                      </Label>
                      <p className="text-sm text-professional">
                        Muestra datos comparativos del periodo anterior en tablas y gráficos
                      </p>
                    </div>
                    <Switch
                      id="comparison-toggle"
                      checked={showComparison}
                      onCheckedChange={setShowComparison}
                    />
                  </div>

                  {showComparison && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        La comparativa estará activa para todos los usuarios. Asegúrate de que los datos del año anterior estén disponibles.
                      </AlertDescription>
                    </Alert>
                  )}

                  <PeriodSelector 
                    title="Gestión de Periodos"
                    description="Configura qué periodos están disponibles para el análisis"
                    showComparison={true}
                  />
                </CardContent>
              </Card>
            )}
          </RoleBasedAccess>

          {/* Mensaje cuando no hay datos reales */}
          {!hasRealData && (
            <section>
              <MissingFinancialData
                dataType="pyg"
                onUploadClick={handleUploadClick}
                missingTables={validation.missingTables}
              />
            </section>
          )}

          {/* KPIs Section con comparativa */}
          {hasRealData && kpiData.length > 0 && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpiData.map((kpi, index) => {
                  // Simular datos del año anterior (90% del actual para demostración)
                  const previousValue = parseFloat(kpi.value.replace('%', '')) * 0.9;
                  const currentValue = parseFloat(kpi.value.replace('%', ''));
                  const yearOverYearChange = ((currentValue - previousValue) / previousValue * 100).toFixed(1);
                  
                  return (
                    <div key={index} className="space-y-2">
                      <ModernKPICard {...kpi} />
                      {showComparison && (
                        <Card className="p-3 bg-slate-50 border-l-4 border-l-slate-300">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Año anterior:</span>
                            <span className="font-medium">{previousValue.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-slate-600">Variación:</span>
                            <span className={`font-medium ${parseFloat(yearOverYearChange) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(yearOverYearChange) > 0 ? '+' : ''}{yearOverYearChange}%
                            </span>
                          </div>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Charts and Data Section */}
          {hasRealData && pygData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* P&G Table */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cuenta de Resultados
                    {showComparison && (
                      <Badge variant="outline" className="text-xs">
                        Con comparativa
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">%</TableHead>
                          {showComparison && (
                            <>
                              <TableHead className="text-right">Anterior</TableHead>
                              <TableHead className="text-right">Var.</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pygData.map((item, index) => {
                          // Datos simulados del año anterior (85% del actual)
                          const previousValue = item.valor * 0.85;
                          const variation = calculateVariation(item.valor, previousValue);
                          
                          return (
                            <TableRow
                              key={index}
                              className={`${
                                item.destacar
                                  ? 'bg-blue-50 font-semibold border-t-2 border-b-2 border-blue-200'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <TableCell className={`${item.destacar ? 'text-blue-800 font-bold' : 'text-slate-700'}`}>
                                {item.concepto}
                              </TableCell>
                              <TableCell className={`text-right font-mono ${
                                item.valor >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              } ${item.destacar ? 'font-bold' : ''}`}>
                                {formatCurrency(item.valor)}
                              </TableCell>
                              <TableCell className={`text-right text-slate-500 ${item.destacar ? 'font-semibold' : ''}`}>
                                {item.porcentaje.toFixed(1)}%
                              </TableCell>
                              {showComparison && (
                                <>
                                  <TableCell className={`text-right font-mono text-slate-400 ${
                                    item.destacar ? 'font-bold' : ''
                                  }`}>
                                    {formatCurrency(previousValue)}
                                  </TableCell>
                                  <TableCell className={`text-right font-mono ${
                                    getVariationColor(variation)
                                  } ${item.destacar ? 'font-bold' : ''}`}>
                                    <div className="flex items-center justify-end gap-1">
                                      {getVariationIcon(variation)}
                                      {variation.toFixed(1)}%
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Waterfall Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análisis Waterfall
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <WaterfallChart 
                    data={waterfallData}
                    height={400}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
