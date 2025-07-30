
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { FileUploader } from '@/components/FileUploader';
import { Gauge } from '@/components/ui/gauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaudeInsights } from '@/components/ClaudeInsights';
import { Activity } from 'lucide-react';

export const RatiosFinancierosPage = () => {
  const [hasData, setHasData] = useState(true); // Start with demo data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Demo ratios data
  const ratiosData = [
    {
      label: 'Liquidez Corriente',
      value: 1.67,
      unit: '',
      max: 3,
      ranges: [
        { min: 0, max: 1, color: '#EF4444', label: 'Crítico' },
        { min: 1, max: 1.5, color: '#F59E0B', label: 'Bajo' },
        { min: 1.5, max: 2.5, color: '#10B981', label: 'Adecuado' },
        { min: 2.5, max: 3, color: '#F59E0B', label: 'Alto' }
      ],
      description: 'Capacidad para cubrir deudas a corto plazo'
    },
    {
      label: 'Ratio Endeudamiento',
      value: 60,
      unit: '%',
      max: 100,
      ranges: [
        { min: 0, max: 50, color: '#10B981', label: 'Bajo' },
        { min: 50, max: 70, color: '#F59E0B', label: 'Moderado' },
        { min: 70, max: 100, color: '#EF4444', label: 'Alto' }
      ],
      description: 'Proporción de deuda sobre activos totales'
    },
    {
      label: 'ROE',
      value: 3.75,
      unit: '%',
      max: 25,
      ranges: [
        { min: 0, max: 10, color: '#EF4444', label: 'Baja' },
        { min: 10, max: 15, color: '#F59E0B', label: 'Moderada' },
        { min: 15, max: 25, color: '#10B981', label: 'Alta' }
      ],
      description: 'Rentabilidad sobre patrimonio neto'
    },
    {
      label: 'ROA',
      value: 1.5,
      unit: '%',
      max: 20,
      ranges: [
        { min: 0, max: 5, color: '#EF4444', label: 'Baja' },
        { min: 5, max: 10, color: '#F59E0B', label: 'Moderada' },
        { min: 10, max: 20, color: '#10B981', label: 'Alta' }
      ],
      description: 'Rentabilidad sobre activos totales'
    },
    {
      label: 'Rotación Activos',
      value: 1.14,
      unit: 'x',
      max: 3,
      ranges: [
        { min: 0, max: 0.5, color: '#EF4444', label: 'Baja' },
        { min: 0.5, max: 1, color: '#F59E0B', label: 'Moderada' },
        { min: 1, max: 3, color: '#10B981', label: 'Alta' }
      ],
      description: 'Eficiencia en el uso de activos'
    },
    {
      label: 'Cobertura Intereses',
      value: 3.33,
      unit: 'x',
      max: 10,
      ranges: [
        { min: 0, max: 1, color: '#EF4444', label: 'Crítica' },
        { min: 1, max: 2.5, color: '#F59E0B', label: 'Baja' },
        { min: 2.5, max: 10, color: '#10B981', label: 'Adecuada' }
      ],
      description: 'Capacidad para cubrir gastos financieros'
    },
    {
      label: 'Deuda/EBITDA',
      value: 2.8,
      unit: 'x',
      max: 5,
      ranges: [
        { min: 0, max: 2, color: '#10B981', label: 'Conservador' },
        { min: 2, max: 3.5, color: '#F59E0B', label: 'Moderado' },
        { min: 3.5, max: 5, color: '#EF4444', label: 'Agresivo' }
      ],
      description: 'Capacidad de pago de deuda vs. generación de caja'
    },
    {
      label: 'Apalancamiento Financiero',
      value: 2.5,
      unit: 'x',
      max: 4,
      ranges: [
        { min: 0, max: 2, color: '#10B981', label: 'Bajo' },
        { min: 2, max: 3, color: '#F59E0B', label: 'Moderado' },
        { min: 3, max: 4, color: '#EF4444', label: 'Alto' }
      ],
      description: 'Activos financiados con deuda vs. patrimonio'
    },
    {
      label: 'Ratio de Capitalización',
      value: 45.8,
      unit: '%',
      max: 100,
      ranges: [
        { min: 0, max: 30, color: '#10B981', label: 'Bajo' },
        { min: 30, max: 60, color: '#F59E0B', label: 'Moderado' },
        { min: 60, max: 100, color: '#EF4444', label: 'Alto' }
      ],
      description: 'Deuda a largo plazo sobre capitalización total'
    }
  ];

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Datos financieros procesados. Ratios actualizados.');
      setHasData(true);
    } catch (err) {
      setError('Error al procesar los datos financieros.');
    } finally {
      setIsLoading(false);
    }
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
                  Análisis de Ratios Financieros
                </h1>
                <p className="text-slate-700 text-lg font-medium">Diagnóstico Integral de la Salud Financiera</p>
              </div>
            </div>
          </section>

          {/* File Upload Section */}
          {!hasData && (
            <section>
              <FileUploader
                title="Cargar Datos Financieros"
                description="Sube los archivos de P&G y Balance para calcular los ratios automáticamente"
                acceptedFormats={['.xlsx', '.csv']}
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
                error={error}
                success={success}
              />
            </section>
          )}

          {/* Ratios Grid */}
          {hasData && (
            <section>
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-r from-steel-50 to-cadet-50">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Ratios Financieros Principales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ratiosData.map((ratio, index) => (
                      <div key={index} className="flex flex-col items-center space-y-4">
                        <Gauge
                          value={ratio.value}
                          max={ratio.max}
                          label={ratio.label}
                          unit={ratio.unit}
                          ranges={ratio.ranges}
                          size="lg"
                        />
                        <p className="text-sm text-slate-600 text-center max-w-xs">
                          {ratio.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Análisis Inteligente con Claude */}
          {hasData && (
            <section>
              <ClaudeInsights
                analysisType="ratios"
                title="Análisis Inteligente de Ratios"
                description="Interpretación automática y recomendaciones generadas por Claude"
                className="border-0 shadow-md"
                autoAnalyze={true}
                showHeader={true}
                showMetrics={true}
                showRecommendations={true}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
