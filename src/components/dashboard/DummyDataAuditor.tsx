import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Database, FileText, Upload } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { supabase } from '@/integrations/supabase/client';

interface DummyDataReport {
  component: string;
  hasDummyData: boolean;
  hasRealData: boolean;
  dataSource: string;
  issues: string[];
  suggestions: string[];
}

export const DummyDataAuditor: React.FC<{ companyId?: string }> = ({ companyId }) => {
  const [reports, setReports] = useState<DummyDataReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasRealData, data: financialData } = useFinancialData();

  useEffect(() => {
    auditDummyData();
  }, [companyId]);

  const auditDummyData = () => {
    setLoading(true);
    
    // Audit all dashboard components for dummy data
    const auditReports: DummyDataReport[] = [
      {
        component: 'KPICardsSection',
        hasDummyData: !hasRealData,
        hasRealData,
        dataSource: hasRealData ? 'Base de datos' : 'Datos mock/hardcoded',
        issues: hasRealData ? [] : [
          'Mostrando datos de ejemplo en lugar de datos reales',
          'Cálculos basados en valores hardcoded',
          'Tendencias simuladas en lugar de cálculos reales'
        ],
        suggestions: hasRealData ? [] : [
          'Cargar datos financieros reales',
          'Verificar que company_id se está pasando correctamente',
          'Comprobar que los datos se están guardando en las tablas correctas'
        ]
      },
      {
        component: 'FinancialKPISection',
        hasDummyData: !hasRealData,
        hasRealData,
        dataSource: hasRealData ? 'Datos procesados' : 'Valores por defecto',
        issues: hasRealData ? [] : [
          'KPIs calculados con datos de prueba',
          'Márgenes y ratios no reflejan la realidad de la empresa'
        ],
        suggestions: hasRealData ? [] : [
          'Subir plantillas de Balance y P&G',
          'Verificar procesamiento de datos financieros'
        ]
      },
      {
        component: 'MainCharts',
        hasDummyData: !hasRealData,
        hasRealData,
        dataSource: hasRealData ? 'Datos históricos' : 'Datos simulados',
        issues: hasRealData ? [] : [
          'Gráficos mostrando tendencias ficticias',
          'Datos históricos no disponibles'
        ],
        suggestions: hasRealData ? [] : [
          'Cargar datos de múltiples períodos',
          'Verificar la cronología de los datos'
        ]
      },
      {
        component: 'TemplateManager',
        hasDummyData: true, // Initially assume it has dummy data
        hasRealData: false, // We need to check template database
        dataSource: 'Mock template service',
        issues: [
          'Plantillas usando datos mock en lugar de base de datos',
          'Generación de plantillas no conectada a templates reales'
        ],
        suggestions: [
          'Migrar a realTemplateService',
          'Conectar con template_schemas table',
          'Implementar generación dinámica de plantillas'
        ]
      }
    ];

    // Add company-specific audit if companyId is provided
    if (companyId) {
      const hasCompanyData = financialData.length > 0;
      
      auditReports.push({
        component: 'CompanyDataIntegrity',
        hasDummyData: !hasCompanyData,
        hasRealData: hasCompanyData,
        dataSource: hasCompanyData ? `Empresa ${companyId}` : 'Sin datos específicos',
        issues: hasCompanyData ? [] : [
          'No hay datos financieros asociados a esta empresa',
          'Los dashboards muestran datos genéricos en lugar de específicos de la empresa'
        ],
        suggestions: hasCompanyData ? [] : [
          'Cargar plantillas financieras para esta empresa específica',
          'Verificar que el company_id se está propagando correctamente',
          'Comprobar las políticas RLS en las tablas financieras'
        ]
      });
    }

    setReports(auditReports);
    setLoading(false);
  };

  const getStatusIcon = (report: DummyDataReport) => {
    if (report.hasRealData && !report.hasDummyData) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertTriangle className="h-5 w-5 text-orange-600" />;
  };

  const getStatusBadge = (report: DummyDataReport) => {
    if (report.hasRealData && !report.hasDummyData) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Datos Reales</Badge>;
    }
    if (report.hasDummyData && !report.hasRealData) {
      return <Badge variant="destructive">Solo Dummy Data</Badge>;
    }
    return <Badge variant="secondary">Datos Mixtos</Badge>;
  };

  const totalIssues = reports.reduce((sum, report) => sum + report.issues.length, 0);
  const componentsWithRealData = reports.filter(r => r.hasRealData && !r.hasDummyData).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Auditando datos dummy...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Auditoría de Datos Dummy
            </CardTitle>
            <Button onClick={auditDummyData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{componentsWithRealData}</div>
              <div className="text-sm text-muted-foreground">Componentes con datos reales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{reports.length - componentsWithRealData}</div>
              <div className="text-sm text-muted-foreground">Componentes con datos dummy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">Issues identificados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(report)}
                  <div>
                    <CardTitle className="text-base">{report.component}</CardTitle>
                    <p className="text-sm text-muted-foreground">Fuente: {report.dataSource}</p>
                  </div>
                </div>
                {getStatusBadge(report)}
              </div>
            </CardHeader>
            
            {(report.issues.length > 0 || report.suggestions.length > 0) && (
              <CardContent className="space-y-4">
                {report.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Issues Identificados
                    </h4>
                    <ul className="space-y-1">
                      {report.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-red-600 pl-6">• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Recomendaciones
                    </h4>
                    <ul className="space-y-1">
                      {report.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-blue-600 pl-6">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Action Panel */}
      {totalIssues > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Acciones Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para eliminar los datos dummy y mostrar información real:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => window.location.href = '/admin/carga-plantillas'}>
                📁 Cargar Plantillas
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/empresas'}>
                🏢 Gestionar Empresas
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/users'}>
                👥 Asignar Usuarios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};