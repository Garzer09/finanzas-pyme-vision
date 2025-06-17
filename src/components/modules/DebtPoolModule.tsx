
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { DebtPoolKPIs } from './debt-pool/DebtPoolKPIs';
import { DebtPoolTable } from './debt-pool/DebtPoolTable';
import { DebtPoolCharts } from './debt-pool/DebtPoolCharts';
import { DebtPoolTimeline } from './debt-pool/DebtPoolTimeline';

interface DebtItem {
  id: string;
  entidad: string;
  tipo: string;
  capitalInicial: number;
  capitalPendiente: number;
  tipoInteres: number;
  plazoRestante: number;
  cuota: number;
  proximoVencimiento: string;
  ultimoVencimiento: string;
  frecuencia: string;
  garantias?: string;
}

export const DebtPoolModule = () => {
  const [debtItems, setDebtItems] = useState<DebtItem[]>([
    {
      id: '1',
      entidad: 'Banco Santander',
      tipo: 'Préstamo ICO',
      capitalInicial: 500000,
      capitalPendiente: 320000,
      tipoInteres: 3.5,
      plazoRestante: 36,
      cuota: 9500,
      proximoVencimiento: '2024-02-15',
      ultimoVencimiento: '2027-02-15',
      frecuencia: 'Mensual',
      garantias: 'Hipoteca sobre inmueble'
    },
    {
      id: '2',
      entidad: 'BBVA',
      tipo: 'Línea de Crédito',
      capitalInicial: 200000,
      capitalPendiente: 150000,
      tipoInteres: 4.2,
      plazoRestante: 12,
      cuota: 0,
      proximoVencimiento: '2024-12-31',
      ultimoVencimiento: '2024-12-31',
      frecuencia: 'A vencimiento',
      garantias: 'Aval personal'
    },
    {
      id: '3',
      entidad: 'CaixaBank',
      tipo: 'Leasing',
      capitalInicial: 180000,
      capitalPendiente: 95000,
      tipoInteres: 3.8,
      plazoRestante: 24,
      cuota: 4200,
      proximoVencimiento: '2024-02-01',
      ultimoVencimiento: '2026-02-01',
      frecuencia: 'Mensual',
      garantias: 'Bien objeto de leasing'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  // Cálculos del pool bancario
  const totalCapitalPendiente = debtItems.reduce((sum, item) => sum + item.capitalPendiente, 0);
  const totalCuotasMensuales = debtItems.reduce((sum, item) => 
    sum + (item.frecuencia === 'Mensual' ? item.cuota : 0), 0);
  const tipoInteresPromedio = debtItems.reduce((sum, item, _, arr) => 
    sum + (item.tipoInteres * item.capitalPendiente) / totalCapitalPendiente, 0);

  // Datos para gráficos
  const debtByEntity = debtItems.map(item => ({
    name: item.entidad,
    value: item.capitalPendiente,
    color: ['#4682B4', '#6495ED', '#87CEEB', '#B0C4DE', '#D3D3D3'][debtItems.indexOf(item) % 5]
  }));

  const debtByType = debtItems.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.name === item.tipo);
    if (existing) {
      existing.value += item.capitalPendiente;
    } else {
      acc.push({
        name: item.tipo,
        value: item.capitalPendiente,
        color: ['#4682B4', '#6495ED', '#87CEEB', '#B0C4DE', '#D3D3D3'][acc.length % 5]
      });
    }
    return acc;
  }, []);

  // Timeline de vencimientos
  const vencimientos = debtItems
    .filter(item => item.cuota > 0)
    .map(item => ({
      entidad: item.entidad,
      fecha: item.proximoVencimiento,
      cuota: item.cuota,
      tipo: item.tipo,
      urgencia: getDaysUntil(item.proximoVencimiento)
    }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  function getDaysUntil(dateStr: string): 'alta' | 'media' | 'baja' {
    const days = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 'alta';
    if (days <= 30) return 'media';
    return 'baja';
  }

  return (
    <div className="flex min-h-screen bg-white" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-light-gray-50">
          <section>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Pool Bancario y Detalle del Endeudamiento</h1>
                <p className="text-gray-600">Gestión y análisis detallado de todas las deudas financieras</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-steel-blue hover:bg-steel-blue-dark text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Deuda
              </Button>
            </div>
          </section>

          {/* Resumen KPIs */}
          <section>
            <DebtPoolKPIs
              totalCapitalPendiente={totalCapitalPendiente}
              tipoInteresPromedio={tipoInteresPromedio}
              totalCuotasMensuales={totalCuotasMensuales}
              debtItemsCount={debtItems.length}
            />
          </section>

          {/* Tabla detallada de deudas */}
          <section>
            <DebtPoolTable debtItems={debtItems} />
          </section>

          {/* Gráficos de composición */}
          <section>
            <DebtPoolCharts
              debtByEntity={debtByEntity}
              debtByType={debtByType}
            />
          </section>

          {/* Timeline de vencimientos */}
          <section>
            <DebtPoolTimeline vencimientos={vencimientos} />
          </section>
        </main>
      </div>
    </div>
  );
};
