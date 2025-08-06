import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, Database, Upload, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditResult {
  component: string;
  category: 'template' | 'data_flow' | 'dummy_data' | 'company_assignment';
  status: 'pass' | 'warning' | 'critical';
  message: string;
  details?: string;
  fixable?: boolean;
}

interface DataSummary {
  companies_count: number;
  templates_count: number;
  upload_history_count: number;
  financial_data_count: number;
  companies_with_data: number;
  orphaned_data_count: number;
}

export const ComprehensiveAudit: React.FC = () => {
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);

  const runComprehensiveAudit = async () => {
    setAuditing(true);
    const results: AuditResult[] = [];

    try {
      // Phase 1: Template System Audit
      await auditTemplateSystem(results);
      
      // Phase 2: Data Flow Audit  
      await auditDataFlow(results);
      
      // Phase 3: Dummy Data Detection
      await auditDummyData(results);
      
      // Phase 4: Company Assignment Audit
      await auditCompanyAssignment(results);
      
      // Phase 5: Data Summary
      await generateDataSummary();

      setAuditResults(results);
      toast.success(`Auditoría completada: ${results.length} verificaciones`);
    } catch (error) {
      toast.error(`Error en auditoría: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setAuditing(false);
    }
  };

  const auditTemplateSystem = async (results: AuditResult[]) => {
    // Check template database existence
    try {
      const { data: schemas, error } = await supabase.from('template_schemas').select('*', { count: 'exact' });
      
      if (error) {
        results.push({
          component: 'Template Database',
          category: 'template',
          status: 'critical',
          message: 'No se puede acceder a template_schemas',
          details: error.message
        });
      } else {
        results.push({
          component: 'Template Database',
          category: 'template', 
          status: 'pass',
          message: `${schemas?.length || 0} plantillas encontradas en base de datos`
        });

        // Check required templates
        const requiredTemplates = ['balance-situacion', 'cuenta-pyg', 'estado-flujos'];
        const existingNames = (schemas || []).map(t => t.name);
        const missingRequired = requiredTemplates.filter(name => !existingNames.includes(name));
        
        if (missingRequired.length > 0) {
          results.push({
            component: 'Required Templates',
            category: 'template',
            status: 'critical',
            message: `Faltan plantillas obligatorias: ${missingRequired.join(', ')}`,
            fixable: true
          });
        } else {
          results.push({
            component: 'Required Templates',
            category: 'template',
            status: 'pass',
            message: 'Todas las plantillas obligatorias están presentes'
          });
        }
      }
    } catch (error) {
      results.push({
        component: 'Template System',
        category: 'template',
        status: 'critical',
        message: 'Error verificando sistema de plantillas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // Check template service functionality
    try {
      const { templateService } = await import('@/services/templateService');
      const templates = await templateService.getTemplates();
      
      results.push({
        component: 'Template Service',
        category: 'template',
        status: 'pass',
        message: `Service funcional: ${templates.length} plantillas disponibles`
      });
    } catch (error) {
      results.push({
        component: 'Template Service',
        category: 'template',
        status: 'critical',
        message: 'Template Service no funciona correctamente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const auditDataFlow = async (results: AuditResult[]) => {
    // Check edge functions existence
    const edgeFunctions = ['template-generator', 'enhanced-template-processor', 'empresa-cualitativa-processor'];
    
    for (const funcName of edgeFunctions) {
      try {
        const { error } = await supabase.functions.invoke(funcName, {
          body: { test: true }
        });
        
        // A 400 error is expected for test calls, it means the function exists
        if (error && !error.message.includes('400')) {
          results.push({
            component: `Edge Function: ${funcName}`,
            category: 'data_flow',
            status: 'warning',
            message: `Función ${funcName} no responde correctamente`,
            details: error.message
          });
        } else {
          results.push({
            component: `Edge Function: ${funcName}`,
            category: 'data_flow',
            status: 'pass',
            message: `Función ${funcName} disponible`
          });
        }
      } catch (error) {
        results.push({
          component: `Edge Function: ${funcName}`,
          category: 'data_flow',
          status: 'critical',
          message: `Función ${funcName} no disponible`,
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Check upload history tracking
    try {
      const { data: uploads, error } = await supabase
        .from('upload_history')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        results.push({
          component: 'Upload History',
          category: 'data_flow',
          status: 'warning',
          message: 'No se puede acceder al historial de cargas',
          details: error.message
        });
      } else {
        results.push({
          component: 'Upload History',
          category: 'data_flow',
          status: 'pass',
          message: 'Historial de cargas funcionando'
        });
      }
    } catch (error) {
      results.push({
        component: 'Upload History',
        category: 'data_flow',
        status: 'critical',
        message: 'Error verificando historial de cargas'
      });
    }
  };

  const auditDummyData = async (results: AuditResult[]) => {
    // Check for hardcoded dummy data in components
    const dummyDataPatterns = [
      'Mock data',
      'dummy data', 
      "value.*'N/A'",
      'MOCK_',
      'simulamos',
      'demo data',
      'fallback.*data'
    ];

    // This would need to be expanded to actually scan components
    // For now, we'll report known issues
    const knownDummyComponents = [
      'projections/tabs/BalanceProyectadoTab',
      'projections/tabs/CashFlowTab',
      'projections/tabs/NOFTab',
      'projections/tabs/PLAnaliticoTab',
      'projections/tabs/PLProyectadoTab',
      'projections/tabs/RatiosTab',
      'projections/tabs/ServicioDeudaTab',
      'projections/tabs/VentasSegmentosTab',
      'dashboard/KPICardsSection'
    ];

    knownDummyComponents.forEach(component => {
      results.push({
        component: `Component: ${component}`,
        category: 'dummy_data',
        status: 'warning',
        message: 'Contiene datos dummy hardcodeados',
        details: 'Necesita conectarse a datos reales de base de datos',
        fixable: true
      });
    });

    // Check if financial data exists
    try {
      const { count: financialCount } = await supabase
        .from('financial_data')
        .select('*', { count: 'exact', head: true });

      if (!financialCount || financialCount === 0) {
        results.push({
          component: 'Financial Data',
          category: 'dummy_data',
          status: 'critical',
          message: 'No hay datos financieros reales en base de datos',
          details: 'Todos los dashboards mostrarán datos dummy'
        });
      } else {
        results.push({
          component: 'Financial Data',
          category: 'dummy_data',
          status: 'pass',
          message: `${financialCount} registros de datos financieros encontrados`
        });
      }
    } catch (error) {
      results.push({
        component: 'Financial Data Check',
        category: 'dummy_data',
        status: 'critical',
        message: 'Error verificando datos financieros'
      });
    }
  };

  const auditCompanyAssignment = async (results: AuditResult[]) => {
    try {
      // Check companies table
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact' });

      if (companiesError) {
        results.push({
          component: 'Companies Table',
          category: 'company_assignment',
          status: 'critical',
          message: 'No se puede acceder a tabla companies',
          details: companiesError.message
        });
        return;
      }

      // Check for orphaned data (data without company_id)
      const financialTables = [
        { name: 'fs_balance_lines', label: 'Balance Lines' },
        { name: 'fs_pyg_lines', label: 'P&G Lines' }, 
        { name: 'fs_cashflow_lines', label: 'Cashflow Lines' },
        { name: 'operational_metrics', label: 'Operational Metrics' }
      ];
      
      for (const table of financialTables) {
        try {
          const { count: orphanedCount } = await supabase
            .from(table.name as any)
            .select('*', { count: 'exact', head: true })
            .is('company_id', null);

          if (orphanedCount && orphanedCount > 0) {
            results.push({
              component: `Table: ${table.label}`,
              category: 'company_assignment',
              status: 'warning',
              message: `${orphanedCount} registros sin company_id asignado`,
              fixable: true
            });
          } else {
            results.push({
              component: `Table: ${table.label}`,
              category: 'company_assignment',
              status: 'pass',
              message: 'Todos los registros tienen company_id válido'
            });
          }
        } catch (error) {
          results.push({
            component: `Table: ${table.label}`,
            category: 'company_assignment',
            status: 'warning',
            message: `No se pudo verificar tabla ${table.name}`,
            details: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // Check memberships consistency
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*', { count: 'exact' });

      if (!membershipsError && companies) {
        const companyIds = companies.map(c => c.id);
        const membershipCompanyIds = (memberships || []).map(m => m.company_id);
        const orphanedMemberships = membershipCompanyIds.filter(id => !companyIds.includes(id));

        if (orphanedMemberships.length > 0) {
          results.push({
            component: 'Memberships',
            category: 'company_assignment',
            status: 'warning',
            message: `${orphanedMemberships.length} membresías apuntan a empresas inexistentes`,
            fixable: true
          });
        } else {
          results.push({
            component: 'Memberships',
            category: 'company_assignment',
            status: 'pass',
            message: 'Todas las membresías son válidas'
          });
        }
      }

    } catch (error) {
      results.push({
        component: 'Company Assignment Audit',
        category: 'company_assignment',
        status: 'critical',
        message: 'Error verificando asignación de empresas'
      });
    }
  };

  const generateDataSummary = async () => {
    try {
      const [companies, templates, uploads, balanceData] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact' }),
        supabase.from('template_schemas').select('*', { count: 'exact' }),
        supabase.from('upload_history').select('*', { count: 'exact' }),
        supabase.from('fs_balance_lines').select('company_id', { count: 'exact' })
      ]);

      // Count companies with data
      const companiesWithData = await supabase
        .from('fs_balance_lines')
        .select('company_id')
        .not('company_id', 'is', null);

      const uniqueCompanies = new Set(companiesWithData.data?.map(d => d.company_id) || []);

      // Count orphaned data
      const orphanedData = await supabase
        .from('fs_balance_lines')
        .select('*', { count: 'exact', head: true })
        .is('company_id', null);

      setDataSummary({
        companies_count: companies.count || 0,
        templates_count: templates.count || 0,
        upload_history_count: uploads.count || 0,
        financial_data_count: balanceData.count || 0,
        companies_with_data: uniqueCompanies.size,
        orphaned_data_count: orphanedData.count || 0
      });
    } catch (error) {
      console.error('Error generating data summary:', error);
    }
  };

  useEffect(() => {
    runComprehensiveAudit();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'template': return <Upload className="h-4 w-4" />;
      case 'data_flow': return <RefreshCw className="h-4 w-4" />;
      case 'dummy_data': return <Eye className="h-4 w-4" />;
      case 'company_assignment': return <Database className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCriticalCount = () => auditResults.filter(r => r.status === 'critical').length;
  const getWarningCount = () => auditResults.filter(r => r.status === 'warning').length;
  const getPassCount = () => auditResults.filter(r => r.status === 'pass').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Auditoría Integral del Sistema</h2>
          <p className="text-muted-foreground">Análisis completo de plantillas, flujo de datos y consistencia</p>
        </div>
        <Button onClick={runComprehensiveAudit} disabled={auditing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${auditing ? 'animate-spin' : ''}`} />
          {auditing ? 'Auditando...' : 'Ejecutar Auditoría'}
        </Button>
      </div>

      {/* Summary Cards */}
      {dataSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{dataSummary.companies_count}</div>
              <div className="text-sm text-muted-foreground">Empresas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{dataSummary.templates_count}</div>
              <div className="text-sm text-muted-foreground">Plantillas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{dataSummary.upload_history_count}</div>
              <div className="text-sm text-muted-foreground">Cargas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{dataSummary.financial_data_count}</div>
              <div className="text-sm text-muted-foreground">Registros Financieros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{dataSummary.companies_with_data}</div>
              <div className="text-sm text-muted-foreground">Empresas con Datos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{dataSummary.orphaned_data_count}</div>
              <div className="text-sm text-muted-foreground">Datos Huérfanos</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-lg font-semibold text-green-700">{getPassCount()}</div>
              <div className="text-sm text-muted-foreground">Verificaciones Exitosas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div className="text-lg font-semibold text-yellow-700">{getWarningCount()}</div>
              <div className="text-sm text-muted-foreground">Advertencias</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div className="text-lg font-semibold text-red-700">{getCriticalCount()}</div>
              <div className="text-sm text-muted-foreground">Problemas Críticos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de la Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(result.category)}
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{result.component}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        {result.fixable && (
                          <Badge variant="outline" className="text-xs">
                            Solucionable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};