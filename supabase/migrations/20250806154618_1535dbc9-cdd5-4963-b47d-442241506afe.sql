-- Fase 1: Diccionario de Métricas y Plantillas Unificadas
-- Crear tabla de diccionario de métricas
CREATE TABLE public.metrics_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_code TEXT NOT NULL UNIQUE,
  metric_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'balance', 'pyg', 'cashflow', 'operational', 'debt', 'assumptions'
  value_kind TEXT NOT NULL DEFAULT 'flow', -- 'flow' (P&L/CF) vs 'stock' (Balance)
  default_unit TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de alias de métricas para mapeo automático
CREATE TABLE public.metric_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_code TEXT NOT NULL REFERENCES public.metrics_dictionary(metric_code),
  alias TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alias, metric_code)
);

-- Crear tabla unificada para series financieras temporales
CREATE TABLE public.financial_series_unified (
  id BIGINT NOT NULL DEFAULT nextval('financial_series_unified_id_seq'::regclass) PRIMARY KEY,
  company_id UUID NOT NULL,
  external_id TEXT, -- company identifier in source system
  metric_code TEXT NOT NULL REFERENCES public.metrics_dictionary(metric_code),
  frequency TEXT NOT NULL, -- 'Y', 'Q', 'M', 'ASOF'
  period TEXT NOT NULL, -- ISO format: 'YYYY', 'YYYY-Q1', 'YYYY-MM', 'YYYY-MM-DD'
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  unit TEXT NOT NULL DEFAULT 'units',
  value_kind TEXT NOT NULL DEFAULT 'flow',
  source TEXT,
  confidence_score NUMERIC DEFAULT 1.0,
  notes TEXT,
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, metric_code, frequency, period)
);

-- Crear tabla para datos de perfil de empresa unificados
CREATE TABLE public.company_profile_unified (
  id BIGINT NOT NULL DEFAULT nextval('company_profile_unified_id_seq'::regclass) PRIMARY KEY,
  company_id UUID NOT NULL,
  external_id TEXT, -- company identifier in source system
  record_type TEXT NOT NULL, -- 'PROFILE', 'SHAREHOLDER', 'PRODUCT', 'NEWS'
  as_of_date DATE NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  source_url TEXT,
  confidence NUMERIC DEFAULT 1.0,
  notes TEXT,
  extra_json JSONB DEFAULT '{}',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, record_type, field_name, as_of_date)
);

-- Crear secuencias para las nuevas tablas
CREATE SEQUENCE IF NOT EXISTS financial_series_unified_id_seq;
CREATE SEQUENCE IF NOT EXISTS company_profile_unified_id_seq;

-- Activar RLS en las nuevas tablas
ALTER TABLE public.metrics_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_series_unified ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profile_unified ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para metrics_dictionary
CREATE POLICY "Everyone can view metrics dictionary" 
ON public.metrics_dictionary FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage metrics dictionary" 
ON public.metrics_dictionary FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Políticas RLS para metric_aliases
CREATE POLICY "Everyone can view metric aliases" 
ON public.metric_aliases FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage metric aliases" 
ON public.metric_aliases FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Políticas RLS para financial_series_unified
CREATE POLICY "Admins can manage financial series unified" 
ON public.financial_series_unified FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Políticas RLS para company_profile_unified
CREATE POLICY "Admins can manage company profiles unified" 
ON public.company_profile_unified FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Poblar diccionario de métricas con datos estándar
INSERT INTO public.metrics_dictionary (metric_code, metric_name, category, value_kind, default_unit, description) VALUES
-- Balance Sheet Metrics
('ACTIVO_TOTAL', 'Activo Total', 'balance', 'stock', 'EUR', 'Total de activos en balance'),
('ACTIVO_CORRIENTE', 'Activo Corriente', 'balance', 'stock', 'EUR', 'Activos corrientes'),
('ACTIVO_NO_CORRIENTE', 'Activo No Corriente', 'balance', 'stock', 'EUR', 'Activos no corrientes'),
('PASIVO_TOTAL', 'Pasivo Total', 'balance', 'stock', 'EUR', 'Total de pasivos'),
('PASIVO_CORRIENTE', 'Pasivo Corriente', 'balance', 'stock', 'EUR', 'Pasivos corrientes'),
('PASIVO_NO_CORRIENTE', 'Pasivo No Corriente', 'balance', 'stock', 'EUR', 'Pasivos no corrientes'),
('PATRIMONIO_NETO', 'Patrimonio Neto', 'balance', 'stock', 'EUR', 'Capital y reservas'),
-- P&L Metrics
('INGRESOS', 'Ingresos', 'pyg', 'flow', 'EUR', 'Ingresos totales'),
('COSTES_VENTAS', 'Coste de Ventas', 'pyg', 'flow', 'EUR', 'Coste directo de ventas'),
('MARGEN_BRUTO', 'Margen Bruto', 'pyg', 'flow', 'EUR', 'Ingresos menos coste de ventas'),
('GASTOS_OPERATIVOS', 'Gastos Operativos', 'pyg', 'flow', 'EUR', 'Gastos de explotación'),
('EBITDA', 'EBITDA', 'pyg', 'flow', 'EUR', 'Beneficio antes de intereses, impuestos, depreciación y amortización'),
('EBIT', 'EBIT', 'pyg', 'flow', 'EUR', 'Beneficio antes de intereses e impuestos'),
('RESULTADO_NETO', 'Resultado Neto', 'pyg', 'flow', 'EUR', 'Beneficio neto después de impuestos'),
-- Cash Flow Metrics
('FLUJO_OPERATIVO', 'Flujo de Caja Operativo', 'cashflow', 'flow', 'EUR', 'Cash flow de operaciones'),
('FLUJO_INVERSION', 'Flujo de Caja de Inversión', 'cashflow', 'flow', 'EUR', 'Cash flow de inversiones'),
('FLUJO_FINANCIACION', 'Flujo de Caja de Financiación', 'cashflow', 'flow', 'EUR', 'Cash flow de financiación'),
('FLUJO_LIBRE', 'Flujo de Caja Libre', 'cashflow', 'flow', 'EUR', 'Free cash flow'),
-- Operational Metrics
('EMPLEADOS', 'Número de Empleados', 'operational', 'stock', 'units', 'Plantilla total'),
('VENTAS_UNIDADES', 'Ventas en Unidades', 'operational', 'flow', 'units', 'Unidades vendidas'),
('PRODUCTIVIDAD', 'Productividad', 'operational', 'flow', 'EUR/employee', 'Ingresos por empleado'),
-- Debt Metrics
('DEUDA_TOTAL', 'Deuda Total', 'debt', 'stock', 'EUR', 'Deuda financiera total'),
('DEUDA_CP', 'Deuda Corto Plazo', 'debt', 'stock', 'EUR', 'Deuda con vencimiento < 1 año'),
('DEUDA_LP', 'Deuda Largo Plazo', 'debt', 'stock', 'EUR', 'Deuda con vencimiento > 1 año'),
-- Financial Assumptions
('CRECIMIENTO_INGRESOS', 'Crecimiento de Ingresos', 'assumptions', 'flow', 'percentage', 'Tasa de crecimiento anual de ingresos'),
('COSTES_VARIABLES_PCT', 'Costes Variables %', 'assumptions', 'flow', 'percentage', 'Costes variables como % de ingresos'),
('COSTES_FIJOS', 'Costes Fijos', 'assumptions', 'flow', 'EUR', 'Costes fijos anuales'),
('CAPEX', 'CAPEX', 'assumptions', 'flow', 'EUR', 'Inversiones de capital anuales'),
('WACC', 'WACC', 'assumptions', 'flow', 'percentage', 'Coste promedio ponderado de capital'),
('CRECIMIENTO_TERMINAL', 'Crecimiento Terminal', 'assumptions', 'flow', 'percentage', 'Tasa de crecimiento a perpetuidad');

-- Poblar alias de métricas comunes
INSERT INTO public.metric_aliases (metric_code, alias, confidence_score) VALUES
-- Balance aliases
('ACTIVO_TOTAL', 'Total Activo', 1.0),
('ACTIVO_TOTAL', 'TOTAL ACTIVO', 1.0),
('ACTIVO_CORRIENTE', 'Activo Circulante', 0.9),
('PASIVO_TOTAL', 'Total Pasivo', 1.0),
('PATRIMONIO_NETO', 'Fondos Propios', 0.9),
('PATRIMONIO_NETO', 'Capital y Reservas', 0.8),
-- P&L aliases
('INGRESOS', 'Ventas', 0.9),
('INGRESOS', 'Importe Neto Cifra Negocios', 1.0),
('INGRESOS', 'Cifra de Negocios', 0.9),
('COSTES_VENTAS', 'Coste de las Ventas', 1.0),
('COSTES_VENTAS', 'Aprovisionamientos', 0.8),
('GASTOS_OPERATIVOS', 'Gastos de Explotación', 1.0),
('GASTOS_OPERATIVOS', 'Gastos de Personal', 0.7),
('RESULTADO_NETO', 'Beneficio Neto', 1.0),
('RESULTADO_NETO', 'Resultado del Ejercicio', 1.0),
-- Cash Flow aliases
('FLUJO_OPERATIVO', 'Flujos de Efectivo de las Actividades de Explotación', 1.0),
('FLUJO_INVERSION', 'Flujos de Efectivo de las Actividades de Inversión', 1.0),
('FLUJO_FINANCIACION', 'Flujos de Efectivo de las Actividades de Financiación', 1.0),
-- Operational aliases
('EMPLEADOS', 'Plantilla', 0.9),
('EMPLEADOS', 'Personal', 0.8),
-- Assumptions aliases
('CRECIMIENTO_INGRESOS', 'Crecimiento ingresos %', 1.0),
('COSTES_VARIABLES_PCT', 'Costes variables %', 1.0),
('WACC', 'WACC %', 1.0),
('CRECIMIENTO_TERMINAL', 'Crecimiento terminal %', 1.0);