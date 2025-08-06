
import React, { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Gauge } from '@/components/ui/gauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClaudeInsights } from '@/components/ClaudeInsights';
import { MissingFinancialData } from '@/components/ui/missing-data-indicator';
import { DataStatusBadge } from '@/components/ui/data-status-badge';
import { useFinancialRatios } from '@/hooks/useFinancialRatios';
import { useDataValidation } from '@/hooks/useDataValidation';
import { Activity } from 'lucide-react';

export const RatiosFinancierosPage = () => {
  // Use real financial ratios data
  const { ratios, loading, error, hasData, missingData } = useFinancialRatios();
  const { validation } = useDataValidation();

  // Transform ratios to gauge format
  const ratiosData = ratios.map(ratio => ({
    label: ratio.name,
    value: ratio.value || 0,
    unit: ratio.unit,
    max: ratio.name === 'ROE' ? 25 : ratio.name === 'ROA' ? 20 : ratio.name === 'Ratio Endeudamiento' ? 100 : 5,
    ranges: ratio.name === 'Liquidez Corriente' ? [
      { min: 0, max: 1, color: '#EF4444', label: 'Crítico' },
      { min: 1, max: 1.5, color: '#F59E0B', label: 'Bajo' },
      { min: 1.5, max: 2.5, color: '#10B981', label: 'Adecuado' },
      { min: 2.5, max: 3, color: '#F59E0B', label: 'Alto' }
    ] : [
      { min: 0, max: 50, color: '#10B981', label: 'Bueno' },
      { min: 50, max: 75, color: '#F59E0B', label: 'Moderado' },
      { min: 75, max: 100, color: '#EF4444', label: 'Alto' }
    ],
    description: ratio.description
  })).filter(r => r.value !== null);

  const handleUploadClick = () => {
    // Navigate to admin upload page
    window.location.href = '/admin/cargas';
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
                    <div className="flex items-center gap-3">
                      <h1 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-steel-600 to-steel-800 bg-clip-text text-transparent">
                        Análisis de Ratios Financieros
                      </h1>
                      <DataStatusBadge 
                        hasData={hasData}
                        lastUpdated={validation.lastUpdated}
                        completeness={validation.completeness}
                        variant="compact"
                      />
                    </div>
                    <p className="text-slate-700 text-lg font-medium">Diagnóstico Integral de la Salud Financiera</p>
              </div>
            </div>
          </section>

          {/* Mensaje cuando no hay datos reales */}
          {!hasData && (
            <section>
              <MissingFinancialData
                dataType="financial"
                onUploadClick={handleUploadClick}
                missingTables={missingData}
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
