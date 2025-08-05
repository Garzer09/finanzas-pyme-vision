import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Trash2, Eye, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataManagementPanelProps {
  companyId: string;
  onDataDeleted?: () => void;
  onDataSaved?: () => void;
}

interface DataSummary {
  table: string;
  count: number;
  lastUpdated: string;
  periods: string[];
}

export const DataManagementPanel: React.FC<DataManagementPanelProps> = ({
  companyId,
  onDataDeleted,
  onDataSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [dataSummary, setDataSummary] = useState<DataSummary[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    loadDataSummary();
  }, [companyId]);

  const loadDataSummary = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const summaries: DataSummary[] = [];

      // Check P&G lines
      try {
        const { error, count } = await supabase
          .from('fs_pyg_lines')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        if (!error && count !== null && count > 0) {
          const { data: sampleData } = await supabase
            .from('fs_pyg_lines')
            .select('period_year, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(10);

          const periods = sampleData 
            ? [...new Set(sampleData.map(d => d.period_year).filter(Boolean))]
            : [];

          summaries.push({
            table: 'fs_pyg_lines',
            count: count,
            lastUpdated: sampleData?.[0]?.created_at || 'Unknown',
            periods: periods.slice(0, 5).map(String)
          });
        }
      } catch (err) {
        console.warn('Could not load P&G data:', err);
      }

      // Check Balance lines
      try {
        const { error, count } = await supabase
          .from('fs_balance_lines')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        if (!error && count !== null && count > 0) {
          const { data: sampleData } = await supabase
            .from('fs_balance_lines')
            .select('period_year, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(10);

          const periods = sampleData 
            ? [...new Set(sampleData.map(d => d.period_year).filter(Boolean))]
            : [];

          summaries.push({
            table: 'fs_balance_lines',
            count: count,
            lastUpdated: sampleData?.[0]?.created_at || 'Unknown',
            periods: periods.slice(0, 5).map(String)
          });
        }
      } catch (err) {
        console.warn('Could not load Balance data:', err);
      }

      // Check Cashflow lines
      try {
        const { error, count } = await supabase
          .from('fs_cashflow_lines')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId);

        if (!error && count !== null && count > 0) {
          const { data: sampleData } = await supabase
            .from('fs_cashflow_lines')
            .select('period_year, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(10);

          const periods = sampleData 
            ? [...new Set(sampleData.map(d => d.period_year).filter(Boolean))]
            : [];

          summaries.push({
            table: 'fs_cashflow_lines',
            count: count,
            lastUpdated: sampleData?.[0]?.created_at || 'Unknown',
            periods: periods.slice(0, 5).map(String)
          });
        }
      } catch (err) {
        console.warn('Could not load Cashflow data:', err);
      }

      // Check other tables
      const otherTables = [
        { name: 'debt_loans' as const, display: 'Pool de Deuda' },
        { name: 'company_info_normalized' as const, display: 'Información Cualitativa' }
      ];

      for (const table of otherTables) {
        try {
          const { error, count } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);

          if (!error && count !== null && count > 0) {
            summaries.push({
              table: table.name,
              count: count,
              lastUpdated: new Date().toISOString(),
              periods: []
            });
          }
        } catch (err) {
          console.warn(`Could not load ${table.name} data:`, err);
        }
      }

      setDataSummary(summaries);
    } catch (error: any) {
      console.error('Error loading data summary:', error);
      toast({
        title: "Error cargando resumen de datos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      let deletedCount = 0;

      // Delete from specific tables with proper typing
      try {
        const { error, count } = await supabase
          .from('fs_pyg_lines')
          .delete({ count: 'exact' })
          .eq('company_id', companyId);
        if (!error && count) deletedCount += count;
      } catch (err) {
        console.warn('Could not delete P&G data:', err);
      }

      try {
        const { error, count } = await supabase
          .from('fs_balance_lines')
          .delete({ count: 'exact' })
          .eq('company_id', companyId);
        if (!error && count) deletedCount += count;
      } catch (err) {
        console.warn('Could not delete Balance data:', err);
      }

      try {
        const { error, count } = await supabase
          .from('fs_cashflow_lines')
          .delete({ count: 'exact' })
          .eq('company_id', companyId);
        if (!error && count) deletedCount += count;
      } catch (err) {
        console.warn('Could not delete Cashflow data:', err);
      }

      try {
        const { error, count } = await supabase
          .from('debt_loans')
          .delete({ count: 'exact' })
          .eq('company_id', companyId);
        if (!error && count) deletedCount += count;
      } catch (err) {
        console.warn('Could not delete debt loans:', err);
      }

      try {
        const { error, count } = await supabase
          .from('company_info_normalized')
          .delete({ count: 'exact' })
          .eq('company_id', companyId);
        if (!error && count) deletedCount += count;
      } catch (err) {
        console.warn('Could not delete company info:', err);
      }

      toast({
        title: "Datos eliminados",
        description: `Se eliminaron ${deletedCount} registros de datos financieros`,
      });

      setShowConfirmDelete(false);
      setDataSummary([]);
      onDataDeleted?.();
      
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error eliminando datos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDataSummary = () => {
    const csvContent = [
      'Tabla,Registros,Última Actualización,Períodos',
      ...dataSummary.map(d => `${d.table},${d.count},${d.lastUpdated},"${d.periods.join(', ')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumen-datos-${companyId}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTableDisplayName = (table: string): string => {
    const names: Record<string, string> = {
      'fs_pyg_lines': 'Cuenta P&G',
      'fs_balance_lines': 'Balance de Situación',
      'fs_cashflow_lines': 'Flujo de Caja',
      'debt_loans': 'Pool de Deuda',
      'debt_maturities': 'Vencimientos de Deuda',
      'operational_metrics': 'Datos Operativos',
      'financial_assumptions_normalized': 'Supuestos Financieros',
      'company_info_normalized': 'Información Cualitativa'
    };
    return names[table] || table;
  };

  const getTotalRecords = () => dataSummary.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Gestión de Datos
        </CardTitle>
        <CardDescription>
          Resumen de datos cargados y opciones de gestión
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Summary */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Cargando resumen de datos...
          </div>
        ) : dataSummary.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Datos Cargados</h4>
              <Badge variant="secondary">
                {getTotalRecords()} registros totales
              </Badge>
            </div>
            
            <div className="grid gap-3">
              {dataSummary.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{getTableDisplayName(data.table)}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} registros
                      {data.periods.length > 0 && (
                        <span className="ml-2">
                          • Períodos: {data.periods.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(data.lastUpdated).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se encontraron datos para esta empresa. 
              Utiliza la funcionalidad de carga para añadir información financiera.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {dataSummary.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDataSummary}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar Resumen
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar Todos los Datos
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadDataSummary}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Actualizar Resumen
          </Button>
        </div>

        {/* Delete Confirmation */}
        {showConfirmDelete && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium">
                  ⚠️ ¿Estás seguro de que quieres eliminar todos los datos?
                </p>
                <p className="text-sm">
                  Esta acción eliminará permanentemente {getTotalRecords()} registros 
                  de todas las tablas financieras. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteData}
                    disabled={loading}
                  >
                    Sí, eliminar todo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};