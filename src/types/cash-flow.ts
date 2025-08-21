// Tipos para Estado de Flujos de Caja

export interface CashFlowLine {
  id: number;
  company_id: string;
  period_date: string;
  period_year: number;
  period_quarter?: number;
  period_month?: number;
  period_type: 'annual' | 'quarterly' | 'monthly';
  category: string;
  concept: string;
  amount: number;
  currency_code: string;
  uploaded_by?: string;
  job_id?: string;
  created_at: string;
}

export interface CashFlowKPI {
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  icon: any; // LucideIcon
  variant: 'default' | 'success' | 'warning' | 'danger';
}

export interface MonthlyCashFlowData {
  mes: string;
  operativo: number;
  inversion: number;
  financiacion: number;
  neto: number;
}

export interface CashFlowDetail {
  concepto: string;
  valor: number;
  destacar?: boolean;
  principal?: boolean;
}

export interface CashFlowSummary {
  flujoOperativo: number;
  flujoInversion: number;
  flujoFinanciacion: number;
  flujoNeto: number;
  flujoOperativoPctVentas: number;
  calidadFCO: number;
  autofinanciacion: number;
  coberturaDeuda: number;
}

export interface CashFlowTrend {
  trend: 'up' | 'down' | 'neutral';
  value: string;
}

export interface CashFlowProjection {
  year: string;
  ocf: number;        // Operating Cash Flow
  icf: number;        // Investing Cash Flow
  fcf: number;        // Free Cash Flow
  cashOnHand: number; // Cash on Hand
}

export interface CashFlowFilters {
  companyId?: string;
  year?: number;
  month?: number;
  category?: string;
  periodType?: 'annual' | 'quarterly' | 'monthly';
}

export interface CashFlowExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeDetails: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Enums para categorías normalizadas
export enum CashFlowCategory {
  OPERATIVO = 'OPERATIVO',
  INVERSION = 'INVERSION',
  FINANCIACION = 'FINANCIACION'
}

// Enums para tipos de período
export enum PeriodType {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly'
}

// Enums para monedas
export enum CurrencyCode {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP'
}

// Tipos para análisis de tendencias
export interface TrendAnalysis {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
}

// Tipos para métricas de rendimiento
export interface CashFlowMetrics {
  operatingCashFlowRatio: number;    // FCO / Ventas
  freeCashFlowYield: number;         // FCF / Capitalización
  cashConversionCycle: number;       // Días de conversión
  cashFlowCoverage: number;          // FCO / Deuda
  reinvestmentRate: number;          // Inversiones / FCF
}

// Tipos para comparativas
export interface CashFlowComparison {
  companyId: string;
  companyName: string;
  metrics: CashFlowMetrics;
  year: number;
  industry: string;
  size: 'small' | 'medium' | 'large';
}

// Tipos para alertas y notificaciones
export interface CashFlowAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  metric: keyof CashFlowMetrics;
  threshold: number;
  currentValue: number;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  acknowledged: boolean;
}

// Tipos para auditoría
export interface CashFlowAudit {
  id: string;
  companyId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'view';
  resource: 'cashflow_line' | 'cashflow_report' | 'cashflow_analysis';
  resourceId?: string;
  changes?: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Tipos para validación
export interface CashFlowValidationRule {
  field: keyof CashFlowLine;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface CashFlowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: Record<string, string[]>;
}

// Tipos para caché y optimización
export interface CashFlowCache {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

// Tipos para sincronización
export interface CashFlowSyncStatus {
  lastSync: string;
  status: 'synced' | 'pending' | 'failed' | 'in_progress';
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
  retryCount: number;
  nextRetry?: string;
}
