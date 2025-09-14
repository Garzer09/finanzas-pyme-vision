import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PygLinesTable } from './manual-data/PygLinesTable';
import { BalanceLinesTable } from './manual-data/BalanceLinesTable';
import { CashflowLinesTable } from './manual-data/CashflowLinesTable';
import { Plus, Save, RefreshCw } from 'lucide-react';

interface ManualDataEntryProps {
  companyId: string;
  onDataSaved?: () => void;
}

export const ManualDataEntry: React.FC<ManualDataEntryProps> = ({
  companyId,
  onDataSaved
}) => {
  const { authState, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('pyg');
  const [isSaving, setIsSaving] = useState(false);

  const [pygData, setPygData] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [cashflowData, setCashflowData] = useState<any[]>([]);

  const addNewRow = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const defaultRow = {
      company_id: companyId,
      period_date: `${currentYear}-12-31`,
      period_type: 'annual',
      period_year: currentYear,
      period_quarter: null,
      period_month: null,
      concept: '',
      amount: 0,
      currency_code: 'EUR',
      uploaded_by: authState.user?.id || null
    };

    switch (activeTab) {
      case 'pyg':
        setPygData(prev => [...prev, { ...defaultRow, id: Date.now() }]);
        break;
      case 'balance':
        setBalanceData(prev => [...prev, { 
          ...defaultRow, 
          id: Date.now(),
          section: 'ACTIVO' 
        }]);
        break;
      case 'cashflow':
        setCashflowData(prev => [...prev, { 
          ...defaultRow, 
          id: Date.now(),
          category: 'OPERATIVO' 
        }]);
        break;
    }
  }, [activeTab, companyId, authState.user?.id]);

  const saveAllData = async () => {
    if (!isAuthenticated || !authState.user?.id) {
      toast.error('Debes estar autenticado para guardar datos');
      return;
    }

    setIsSaving(true);
    try {
      const results = [];

      // Save PyG data
      if (pygData.length > 0) {
        const validPygData = pygData.filter(row => row.concept && row.amount !== null);
        if (validPygData.length > 0) {
          const { error: pygError } = await supabase
            .from('fs_pyg_lines')
            .upsert(
              validPygData.map(({ id, ...row }) => ({
                ...row,
                company_id: companyId,
                uploaded_by: authState.user.id,
                job_id: crypto.randomUUID(),
                created_at: new Date().toISOString()
              })),
              { 
                onConflict: 'company_id,period_type,period_year,period_quarter,period_month,concept',
                ignoreDuplicates: false 
              }
            );
          
          if (pygError) throw pygError;
          results.push(`${validPygData.length} líneas de P&G`);
        }
      }

      // Save Balance data
      if (balanceData.length > 0) {
        const validBalanceData = balanceData.filter(row => row.concept && row.section && row.amount !== null);
        if (validBalanceData.length > 0) {
          const { error: balanceError } = await supabase
            .from('fs_balance_lines')
            .upsert(
              validBalanceData.map(({ id, ...row }) => ({
                ...row,
                company_id: companyId,
                uploaded_by: authState.user.id,
                job_id: crypto.randomUUID(),
                created_at: new Date().toISOString()
              })),
              { 
                onConflict: 'company_id,period_type,period_year,period_quarter,period_month,section,concept',
                ignoreDuplicates: false 
              }
            );
          
          if (balanceError) throw balanceError;
          results.push(`${validBalanceData.length} líneas de Balance`);
        }
      }

      // Save Cashflow data
      if (cashflowData.length > 0) {
        const validCashflowData = cashflowData.filter(row => row.concept && row.category && row.amount !== null);
        if (validCashflowData.length > 0) {
          const { error: cashflowError } = await supabase
            .from('fs_cashflow_lines')
            .upsert(
              validCashflowData.map(({ id, ...row }) => ({
                ...row,
                company_id: companyId,
                uploaded_by: authState.user.id,
                job_id: crypto.randomUUID(),
                created_at: new Date().toISOString()
              })),
              { 
                onConflict: 'company_id,period_type,period_year,period_quarter,period_month,concept',
                ignoreDuplicates: false 
              }
            );
          
          if (cashflowError) throw cashflowError;
          results.push(`${validCashflowData.length} líneas de Flujo de Caja`);
        }
      }

      if (results.length > 0) {
        toast.success(`Datos guardados exitosamente: ${results.join(', ')}`);
        onDataSaved?.();
      } else {
        toast.warning('No hay datos válidos para guardar');
      }

    } catch (error: any) {
      console.error('Error saving data:', error);
      toast.error(`Error al guardar datos: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getRowCount = () => {
    switch (activeTab) {
      case 'pyg': return pygData.length;
      case 'balance': return balanceData.length;
      case 'cashflow': return cashflowData.length;
      default: return 0;
    }
  };

  const getTotalRows = () => pygData.length + balanceData.length + cashflowData.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Introducción Manual de Datos</CardTitle>
            <p className="text-muted-foreground mt-2">
              Introduce los datos financieros directamente usando las tablas que replican exactamente la estructura de Supabase
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {getTotalRows()} filas totales
            </Badge>
            <Button 
              onClick={saveAllData}
              disabled={isSaving || getTotalRows() === 0}
              className="gap-2"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar Todo'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pyg" className="gap-2">
                P&G 
                <Badge variant="secondary" className="text-xs">
                  {pygData.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="balance" className="gap-2">
                Balance 
                <Badge variant="secondary" className="text-xs">
                  {balanceData.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="gap-2">
                Flujo de Caja 
                <Badge variant="secondary" className="text-xs">
                  {cashflowData.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={addNewRow}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir Fila
            </Button>
          </div>

          <TabsContent value="pyg" className="space-y-4">
            <div className="rounded-md border">
              <PygLinesTable 
                data={pygData}
                onChange={setPygData}
                companyId={companyId}
              />
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <div className="rounded-md border">
              <BalanceLinesTable 
                data={balanceData}
                onChange={setBalanceData}
                companyId={companyId}
              />
            </div>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <div className="rounded-md border">
              <CashflowLinesTable 
                data={cashflowData}
                onChange={setCashflowData}
                companyId={companyId}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">💡 Consejos para la introducción manual:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Los datos se guardan directamente en las tablas de Supabase (fs_pyg_lines, fs_balance_lines, fs_cashflow_lines)</li>
            <li>• Las fechas se almacenan como fin de periodo (ej: 2024-12-31 para el año 2024)</li>
            <li>• Los importes deben ser números (sin puntos de miles, usa punto para decimales)</li>
            <li>• Al guardar, se crean registros únicos por empresa, periodo y concepto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};