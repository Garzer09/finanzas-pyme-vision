
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FileUploader } from '@/components/FileUploader';
import { WaterfallChart } from '@/components/ui/waterfall-chart';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, TrendingUp, TrendingDown, Target } from 'lucide-react';

export const CuentaPyGPage = () => {
  const [hasData, setHasData] = useState(true); // Start with demo data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Demo P&G data
  const pygData = [
    { concepto: 'Importe Neto Cifra Negocios', valor: 2400000, porcentaje: 100 },
    { concepto: 'Aprovisionamientos', valor: -1680000, porcentaje: -70 },
    { concepto: 'Gastos Personal', valor: -480000, porcentaje: -20 },
    { concepto: 'Otros Gastos Explotación', valor: -120000, porcentaje: -5 },
    { concepto: 'EBITDA', valor: 120000, porcentaje: 5, destacar: true },
    { concepto: 'Amortizaciones', valor: -60000, porcentaje: -2.5 },
    { concepto: 'EBIT', valor: 60000, porcentaje: 2.5, destacar: true },
    { concepto: 'Gastos Financieros', valor: -18000, porcentaje: -0.75 },
    { concepto: 'Resultado antes Impuestos', valor: 42000, porcentaje: 1.75 },
    { concepto: 'Impuestos', valor: -10500, porcentaje: -0.44 },
    { concepto: 'Resultado Neto', valor: 31500, porcentaje: 1.31, destacar: true },
  ];

  // Waterfall chart data
  const waterfallData = [
    { name: 'Ingresos', value: 2400000, type: 'total' as const },
    { name: 'Aprovisionamientos', value: -1680000, type: 'negative' as const },
    { name: 'Gastos Personal', value: -480000, type: 'negative' as const },
    { name: 'Otros Gastos', value: -120000, type: 'negative' as const },
    { name: 'EBITDA', value: 120000, type: 'total' as const },
    { name: 'Amortizaciones', value: -60000, type: 'negative' as const },
    { name: 'EBIT', value: 60000, type: 'total' as const },
    { name: 'Gastos Financieros', value: -18000, type: 'negative' as const },
    { name: 'Impuestos', value: -10500, type: 'negative' as const },
    { name: 'Resultado Neto', value: 31500, type: 'total' as const },
  ];

  // KPI data
  const kpiData = [
    {
      title: 'Margen Bruto',
      value: '30%',
      subtitle: '€720,000',
      trend: 'up' as const,
      trendValue: '+2%',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'Margen EBITDA',
      value: '5%',
      subtitle: '€120,000',
      trend: 'neutral' as const,
      trendValue: '0%',
      icon: Target,
      variant: 'warning' as const
    },
    {
      title: 'Margen Neto',
      value: '1.3%',
      subtitle: '€31,500',
      trend: 'down' as const,
      trendValue: '-0.5%',
      icon: TrendingDown,
      variant: 'danger' as const
    }
  ];

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success
      setSuccess('Archivo procesado correctamente. Datos actualizados.');
      setHasData(true);
    } catch (err) {
      setError('Error al procesar el archivo. Verifique el formato y estructura.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                  Cuenta de Pérdidas y Ganancias
                </h1>
                <p className="text-slate-700 text-lg font-medium">Año Actual - Análisis de Resultados</p>
              </div>
            </div>
          </section>

          {/* File Upload Section */}
          {!hasData && (
            <section>
              <FileUploader
                title="Cargar Datos P&G"
                description="Sube tu archivo de Cuenta de Pérdidas y Ganancias siguiendo la estructura PGC-ICAC"
                acceptedFormats={['.xlsx', '.csv']}
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
                error={error}
                success={success}
              />
            </section>
          )}

          {/* KPIs Section */}
          {hasData && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpiData.map((kpi, index) => (
                  <ModernKPICard key={index} {...kpi} />
                ))}
              </div>
            </section>
          )}

          {/* Charts and Data Section */}
          {hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* P&G Table */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cuenta de Resultados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Importe</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pygData.map((item, index) => (
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
                          </TableRow>
                        ))}
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
