
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
    <main className="flex-1 p-6 space-y-8 overflow-auto bg-gradient-to-br from-light-gray-50 via-white to-steel-blue-light/20" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
          {/* Header Section with Enhanced Glass Effect */}
          <section className="relative">
            <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl p-8 shadow-2xl shadow-steel-blue/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-steel-blue/8 via-steel-blue-light/5 to-light-gray-100/8 rounded-3xl"></div>
              {/* Enhanced glass reflection */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>
              <div className="absolute top-0 left-0 w-32 h-32 bg-steel-blue/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-light-gray-200/8 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-steel-blue to-steel-blue-dark bg-clip-text text-transparent">
                  Pool Bancario y Detalle del Endeudamiento
                </h1>
                <p className="text-gray-700 text-lg font-medium">Gestión y análisis detallado de todas las deudas financieras</p>
              </div>
            </div>
          </section>

          {/* Action Button */}
          <section className="flex justify-end">
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-steel-blue/90 backdrop-blur-sm hover:bg-steel-blue hover:shadow-xl hover:shadow-steel-blue/20 text-white border border-white/20 transition-all duration-300 hover:-translate-y-1 rounded-2xl px-6 py-3"
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir Deuda
            </Button>
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
  );
};
