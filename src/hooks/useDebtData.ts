import { useState, useMemo } from 'react';

export interface DebtItem {
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

export interface RiskMetrics {
  dscr: number; // Debt Service Coverage Ratio
  netDebtEbitda: number; // Net Debt / EBITDA
  interestCoverage: number; // EBITDA / Interest Payments
}

export const useDebtData = () => {
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
    },
    {
      id: '4',
      entidad: 'Banco Sabadell',
      tipo: 'Descuento Comercial',
      capitalInicial: 100000,
      capitalPendiente: 85000,
      tipoInteres: 2.8,
      plazoRestante: 6,
      cuota: 0,
      proximoVencimiento: '2024-08-15',
      ultimoVencimiento: '2024-08-15',
      frecuencia: 'A vencimiento',
      garantias: 'Sin garantías'
    }
  ]);

  // Cálculos principales
  const totalCapitalPendiente = useMemo(() => 
    debtItems.reduce((sum, item) => sum + item.capitalPendiente, 0)
  , [debtItems]);

  const tirPromedio = useMemo(() => 
    debtItems.reduce((sum, item) => 
      sum + (item.tipoInteres * item.capitalPendiente) / totalCapitalPendiente, 0)
  , [debtItems, totalCapitalPendiente]);

  const cuotaMensualTotal = useMemo(() => 
    debtItems.reduce((sum, item) => 
      sum + (item.frecuencia === 'Mensual' ? item.cuota : 0), 0)
  , [debtItems]);

  // Datos para gráficos por entidad (barra horizontal apilada)
  const debtByEntity = useMemo(() => 
    debtItems.map((item, index) => ({
      name: item.entidad,
      value: item.capitalPendiente,
      percentage: (item.capitalPendiente / totalCapitalPendiente) * 100,
      color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][index % 5]
    }))
  , [debtItems, totalCapitalPendiente]);

  // Datos para treemap por tipo
  const debtByType = useMemo(() => {
    const typeGroups = debtItems.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.name === item.tipo);
      if (existing) {
        existing.value += item.capitalPendiente;
      } else {
        acc.push({
          name: item.tipo,
          value: item.capitalPendiente,
          color: ['#005E8A', '#6BD1FF', '#0ea5e9', '#0284c7', '#0369a1'][acc.length % 5]
        });
      }
      return acc;
    }, []);

    return typeGroups.map(group => ({
      ...group,
      percentage: (group.value / totalCapitalPendiente) * 100
    }));
  }, [debtItems, totalCapitalPendiente]);

  // Calendar de vencimientos con color coding
  const vencimientos = useMemo(() => {
    const getDaysUntil = (dateStr: string): number => {
      return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    };

    const getUrgency = (days: number): 'alta' | 'media' | 'baja' => {
      if (days <= 30) return 'alta';
      if (days <= 90) return 'media';
      return 'baja';
    };

    return debtItems
      .filter(item => item.cuota > 0 || item.frecuencia === 'A vencimiento')
      .map(item => {
        const daysUntil = getDaysUntil(item.proximoVencimiento);
        return {
          id: item.id,
          entidad: item.entidad,
          tipo: item.tipo,
          importe: item.cuota > 0 ? item.cuota : item.capitalPendiente,
          fecha: item.proximoVencimiento,
          daysUntil,
          urgency: getUrgency(daysUntil)
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [debtItems]);

  // Métricas de riesgo (simuladas)
  const riskMetrics = useMemo((): RiskMetrics => {
    const ebitda = 450000; // Simulado
    const totalAnnualDebtService = cuotaMensualTotal * 12;
    const totalInterest = debtItems.reduce((sum, item) => 
      sum + (item.capitalPendiente * item.tipoInteres / 100), 0);

    return {
      dscr: ebitda / totalAnnualDebtService,
      netDebtEbitda: totalCapitalPendiente / ebitda,
      interestCoverage: ebitda / totalInterest
    };
  }, [debtItems, cuotaMensualTotal, totalCapitalPendiente]);

  const addDebtItem = (newItem: Omit<DebtItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setDebtItems(prev => [...prev, { ...newItem, id }]);
  };

  const updateDebtItem = (id: string, updates: Partial<DebtItem>) => {
    setDebtItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteDebtItem = (id: string) => {
    setDebtItems(prev => prev.filter(item => item.id !== id));
  };

  return {
    debtItems,
    totalCapitalPendiente,
    tirPromedio,
    cuotaMensualTotal,
    debtByEntity,
    debtByType,
    vencimientos,
    riskMetrics,
    addDebtItem,
    updateDebtItem,
    deleteDebtItem
  };
};