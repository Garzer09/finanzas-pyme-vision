
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FileUploader } from '@/components/FileUploader';
import { ModernKPICard } from '@/components/ui/modern-kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Scale, TrendingUp, AlertTriangle } from 'lucide-react';

export const BalanceSituacionPage = () => {
  const [hasData, setHasData] = useState(true); // Start with demo data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Demo Balance data
  const activoData = [
    { concepto: 'Inmovilizado Material', valor: 800000 },
    { concepto: 'Inmovilizado Intangible', valor: 300000 },
    { concepto: 'Inversiones Financieras L/P', valor: 100000 },
    { concepto: 'ACTIVO NO CORRIENTE', valor: 1200000, destacar: true },
    { concepto: 'Existencias', valor: 300000 },
    { concepto: 'Deudores Comerciales', valor: 400000 },
    { concepto: 'Otros Créditos', valor: 80000 },
    { concepto: 'Tesorería', valor: 120000 },
    { concepto: 'ACTIVO CORRIENTE', valor: 900000, destacar: true },
    { concepto: 'TOTAL ACTIVO', valor: 2100000, destacar: true, total: true },
  ];

  const pasivoData = [
    { concepto: 'Capital Social', valor: 300000 },
    { concepto: 'Reservas', valor: 450000 },
    { concepto: 'Resultado del Ejercicio', valor: 90000 },
    { concepto: 'PATRIMONIO NETO', valor: 840000, destacar: true },
    { concepto: 'Deudas L/P con Entidades Crédito', valor: 600000 },
    { concepto: 'Otras Deudas L/P', valor: 120000 },
    { concepto: 'PASIVO NO CORRIENTE', valor: 720000, destacar: true },
    { concepto: 'Deudas C/P con Entidades Crédito', valor: 240000 },
    { concepto: 'Acreedores Comerciales', valor: 250000 },
    { concepto: 'Otras Deudas C/P', valor: 50000 },
    { concepto: 'PASIVO CORRIENTE', valor: 540000, destacar: true },
    { concepto: 'TOTAL PASIVO', valor: 2100000, destacar: true, total: true },
  ];

  // Chart data for horizontal bars
  const chartData = [
    { name: 'Inmovilizado', activo: 1200000, pasivo: 0, color: '#4682B4' },
    { name: 'Existencias', activo: 300000, pasivo: 0, color: '#5F9EA0' },
    { name: 'Deudores', activo: 480000, pasivo: 0, color: '#87CEEB' },
    { name: 'Tesorería', activo: 120000, pasivo: 0, color: '#B0E0E6' },
    { name: 'Patrimonio Neto', activo: 0, pasivo: -840000, color: '#32CD32' },
    { name: 'Deuda L/P', activo: 0, pasivo: -720000, color: '#FFD700' },
    { name: 'Deuda C/P', activo: 0, pasivo: -540000, color: '#FF6347' },
  ];

  // KPI data
  const kpiData = [
    {
      title: 'Total Activo',
      value: '€2.1M',
      subtitle: 'Recursos Totales',
      trend: 'up' as const,
      trendValue: '+5%',
      icon: TrendingUp,
      variant: 'success' as const
    },
    {
      title: 'Liquidez',
      value: '1.67',
      subtitle: 'Ratio Corriente',
      trend: 'up' as const,
      trendValue: '+0.2',
      icon: Scale,
      variant: 'success' as const
    },
    {
      title: 'Endeudamiento',
      value: '60%',
      subtitle: 'Deuda/Activo Total',
      trend: 'up' as const,
      trendValue: '+3%',
      icon: AlertTriangle,
      variant: 'warning' as const
    }
  ];

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Archivo de balance procesado correctamente.');
      setHasData(true);
    } catch (err) {
      setError('Error al procesar el archivo de balance.');
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
    }).format(Math.abs(value));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{label}</p>
          {data.activo > 0 && (
            <p className="text-steel-600">
              Activo: <span className="font-medium">{formatCurrency(data.activo)}</span>
            </p>
          )}
          {data.pasivo < 0 && (
            <p className="text-cadet-600">
              Pasivo: <span className="font-medium">{formatCurrency(data.pasivo)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
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
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                  Balance de Situación
                </h1>
                <p className="text-slate-700 text-lg font-medium">Año Actual - Estructura Patrimonial</p>
              </div>
            </div>
          </section>

          {/* File Upload Section */}
          {!hasData && (
            <section>
              <FileUploader
                title="Cargar Balance de Situación"
                description="Sube tu archivo de Balance siguiendo la estructura PGC-ICAC"
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

          {/* Balance Chart and Tables */}
          {hasData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activo Table */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-steel-50 to-steel-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    ACTIVO
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {activoData.map((item, index) => (
                          <TableRow
                            key={index}
                            className={`${
                              item.destacar
                                ? item.total
                                  ? 'bg-steel-100 font-bold border-t-2 border-b-2 border-steel-300'
                                  : 'bg-steel-50 font-semibold border-t border-b border-steel-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <TableCell className={`${
                              item.destacar ? 'text-steel-800 font-bold' : 'text-slate-700'
                            }`}>
                              {item.concepto}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-steel-600 ${
                              item.destacar ? 'font-bold' : ''
                            }`}>
                              {formatCurrency(item.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Chart */}
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-cadet-50 to-cadet-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Estructura Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={chartData}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        type="number"
                        tickFormatter={formatCurrency}
                        fontSize={12}
                        stroke="#6B7280"
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        fontSize={12}
                        stroke="#6B7280"
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="activo" 
                        fill="#4682B4" 
                        radius={[0, 4, 4, 0]}
                        name="Activo"
                      />
                      <Bar 
                        dataKey="pasivo" 
                        fill="#5F9EA0" 
                        radius={[4, 0, 0, 4]}
                        name="Pasivo"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pasivo Table */}
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cadet-50 to-cadet-100">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    PASIVO
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableBody>
                        {pasivoData.map((item, index) => (
                          <TableRow
                            key={index}
                            className={`${
                              item.destacar
                                ? item.total
                                  ? 'bg-cadet-100 font-bold border-t-2 border-b-2 border-cadet-300'
                                  : 'bg-cadet-50 font-semibold border-t border-b border-cadet-200'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <TableCell className={`${
                              item.destacar ? 'text-cadet-800 font-bold' : 'text-slate-700'
                            }`}>
                              {item.concepto}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-cadet-600 ${
                              item.destacar ? 'font-bold' : ''
                            }`}>
                              {formatCurrency(item.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
