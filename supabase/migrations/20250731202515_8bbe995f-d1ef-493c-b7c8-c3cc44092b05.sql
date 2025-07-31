-- ===== SISTEMA CSV ROBUSTO - TABLAS NORMALIZADAS =====

-- 1. Estados financieros P&L normalizados
CREATE TABLE IF NOT EXISTS public.fs_pyg_lines (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  concept TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_pyg_period
  ON public.fs_pyg_lines(company_id, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0), concept);

-- 2. Balance normalizado
CREATE TABLE IF NOT EXISTS public.fs_balance_lines (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  section TEXT NOT NULL, -- ACTIVO_NC, ACTIVO_C, PATRIMONIO_NETO, PASIVO_NC, PASIVO_C
  concept TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_balance_period
  ON public.fs_balance_lines(company_id, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0), concept);

-- 3. Estado de flujos de efectivo
CREATE TABLE IF NOT EXISTS public.fs_cashflow_lines (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  category TEXT NOT NULL, -- OPERACIONES, INVERSION, FINANCIACION
  concept TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_cashflow_period
  ON public.fs_cashflow_lines(company_id, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0), concept);

-- 4. Pool de deuda - préstamos principales
CREATE TABLE IF NOT EXISTS public.debt_loans (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  loan_key TEXT NOT NULL, -- hash estable de {entity_name|loan_type|maturity_date|currency}
  entity_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  initial_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0 AND interest_rate <= 100),
  maturity_date DATE NOT NULL,
  guarantees TEXT,
  observations TEXT,
  currency_code TEXT NOT NULL DEFAULT 'EUR',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para clave estable
CREATE UNIQUE INDEX IF NOT EXISTS ux_debt_loans_key
  ON public.debt_loans(company_id, loan_key);

-- 5. Saldos de deuda por año
CREATE TABLE IF NOT EXISTS public.debt_balances (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  loan_id BIGINT NOT NULL REFERENCES public.debt_loans(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  year_end_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, loan_id, year)
);

-- 6. Vencimientos de deuda
CREATE TABLE IF NOT EXISTS public.debt_maturities (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  maturity_year INTEGER NOT NULL,
  principal_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  breakdown_json JSONB DEFAULT '{}',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, maturity_year)
);

-- 7. Métricas operativas
CREATE TABLE IF NOT EXISTS public.operational_metrics (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  segment TEXT, -- opcional para segmentación
  metric_name TEXT NOT NULL,
  value NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_operational_period
  ON public.operational_metrics(company_id, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0), COALESCE(segment,''), metric_name);

-- 8. Información de empresa
CREATE TABLE IF NOT EXISTS public.company_info_normalized (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT,
  industry TEXT,
  employees_count INTEGER,
  headquarters TEXT,
  website TEXT,
  founded_year INTEGER,
  description TEXT,
  products JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  key_facts JSONB DEFAULT '[]',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- 9. Supuestos financieros
CREATE TABLE IF NOT EXISTS public.financial_assumptions_normalized (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  assumption_category TEXT NOT NULL, -- REVENUES, COSTS, CAPEX, WORKING_CAPITAL, DEBT, TAX
  assumption_name TEXT NOT NULL,
  assumption_value NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'percentage',
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly', 'monthly')),
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,
  period_month INTEGER,
  notes TEXT,
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para idempotencia
CREATE UNIQUE INDEX IF NOT EXISTS ux_assumptions_period
  ON public.financial_assumptions_normalized(company_id, assumption_category, assumption_name, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0));

-- 10. Ratios calculados (Materialized View)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.fs_ratios_mv AS
WITH balance_data AS (
  SELECT 
    company_id,
    period_type,
    period_year,
    period_quarter,
    period_month,
    SUM(CASE WHEN section = 'ACTIVO_C' THEN amount ELSE 0 END) AS activo_corriente,
    SUM(CASE WHEN section = 'ACTIVO_NC' THEN amount ELSE 0 END) AS activo_no_corriente,
    SUM(CASE WHEN section IN ('ACTIVO_C', 'ACTIVO_NC') THEN amount ELSE 0 END) AS total_activo,
    SUM(CASE WHEN section = 'PASIVO_C' THEN amount ELSE 0 END) AS pasivo_corriente,
    SUM(CASE WHEN section = 'PASIVO_NC' THEN amount ELSE 0 END) AS pasivo_no_corriente,
    SUM(CASE WHEN section IN ('PASIVO_C', 'PASIVO_NC') THEN amount ELSE 0 END) AS total_pasivo,
    SUM(CASE WHEN section = 'PATRIMONIO_NETO' THEN amount ELSE 0 END) AS patrimonio_neto,
    SUM(CASE WHEN concept ILIKE '%existencias%' THEN amount ELSE 0 END) AS existencias,
    SUM(CASE WHEN concept ILIKE '%efectivo%' OR concept ILIKE '%tesorería%' THEN amount ELSE 0 END) AS efectivo,
    SUM(CASE WHEN concept ILIKE '%clientes%' OR concept ILIKE '%deudores%' THEN amount ELSE 0 END) AS clientes,
    SUM(CASE WHEN concept ILIKE '%proveedores%' OR concept ILIKE '%acreedores%' THEN amount ELSE 0 END) AS proveedores
  FROM public.fs_balance_lines
  GROUP BY company_id, period_type, period_year, period_quarter, period_month
),
pyg_data AS (
  SELECT 
    company_id,
    period_type,
    period_year,
    period_quarter,
    period_month,
    SUM(CASE WHEN concept ILIKE '%cifra de negocios%' OR concept ILIKE '%ventas%' THEN amount ELSE 0 END) AS ventas,
    SUM(CASE WHEN concept ILIKE '%aprovisionamientos%' OR concept ILIKE '%compras%' THEN amount ELSE 0 END) AS compras,
    SUM(CASE WHEN concept ILIKE '%gastos financieros%' THEN amount ELSE 0 END) AS gastos_financieros,
    SUM(CASE WHEN concept ILIKE '%resultado%' AND concept ILIKE '%ejercicio%' THEN amount ELSE 0 END) AS resultado_neto
  FROM public.fs_pyg_lines
  GROUP BY company_id, period_type, period_year, period_quarter, period_month
)
SELECT 
  b.company_id,
  b.period_type,
  b.period_year,
  b.period_quarter,
  b.period_month,
  -- LIQUIDEZ
  CASE WHEN b.pasivo_corriente > 0 THEN ROUND(b.activo_corriente / b.pasivo_corriente, 2) ELSE NULL END AS ratio_corriente,
  CASE WHEN b.pasivo_corriente > 0 THEN ROUND((b.activo_corriente - b.existencias) / b.pasivo_corriente, 2) ELSE NULL END AS prueba_acida,
  CASE WHEN b.pasivo_corriente > 0 THEN ROUND(b.efectivo / b.pasivo_corriente, 2) ELSE NULL END AS ratio_tesoreria,
  -- ENDEUDAMIENTO
  CASE WHEN b.total_activo > 0 THEN ROUND(b.total_pasivo / b.total_activo * 100, 2) ELSE NULL END AS ratio_endeudamiento_total,
  CASE WHEN b.patrimonio_neto > 0 THEN ROUND(b.total_pasivo / b.patrimonio_neto * 100, 2) ELSE NULL END AS ratio_endeudamiento_financiero,
  CASE WHEN b.total_activo > 0 THEN ROUND(b.patrimonio_neto / b.total_activo * 100, 2) ELSE NULL END AS autonomia_financiera,
  -- RENTABILIDAD
  CASE WHEN b.total_activo > 0 THEN ROUND(p.resultado_neto / b.total_activo * 100, 2) ELSE NULL END AS roa,
  CASE WHEN b.patrimonio_neto > 0 THEN ROUND(p.resultado_neto / b.patrimonio_neto * 100, 2) ELSE NULL END AS roe,
  CASE WHEN p.ventas > 0 THEN ROUND(p.resultado_neto / p.ventas * 100, 2) ELSE NULL END AS margen_neto,
  -- ACTIVIDAD
  CASE WHEN b.total_activo > 0 THEN ROUND(p.ventas / b.total_activo, 2) ELSE NULL END AS rotacion_activos,
  now() AS calculated_at
FROM balance_data b
LEFT JOIN pyg_data p ON (
  b.company_id = p.company_id AND 
  b.period_type = p.period_type AND 
  b.period_year = p.period_year AND 
  COALESCE(b.period_quarter, 0) = COALESCE(p.period_quarter, 0) AND 
  COALESCE(b.period_month, 0) = COALESCE(p.period_month, 0)
);

-- Índice único para la MV
CREATE UNIQUE INDEX IF NOT EXISTS ux_ratios_mv_period
  ON public.fs_ratios_mv(company_id, period_type, period_year, COALESCE(period_quarter,0), COALESCE(period_month,0));

-- 11. Benchmarks externos (ratios subidos por usuario)
CREATE TABLE IF NOT EXISTS public.benchmarks_ratios (
  id BIGSERIAL PRIMARY KEY,
  company_id UUID NOT NULL,
  period_year INTEGER NOT NULL,
  ratio_category TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  ratio_value NUMERIC(10,2),
  source TEXT NOT NULL DEFAULT 'user_upload',
  uploaded_by UUID,
  job_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== POLÍTICAS RLS ADMIN-ONLY =====

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.fs_pyg_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_balance_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fs_cashflow_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_maturities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_assumptions_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks_ratios ENABLE ROW LEVEL SECURITY;

-- Políticas admin-only para todas las tablas
CREATE POLICY "Admin can manage P&L data" ON public.fs_pyg_lines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Balance data" ON public.fs_balance_lines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Cashflow data" ON public.fs_cashflow_lines
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Debt loans" ON public.debt_loans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Debt balances" ON public.debt_balances
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Debt maturities" ON public.debt_maturities
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Operational metrics" ON public.operational_metrics
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Company info" ON public.company_info_normalized
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Financial assumptions" ON public.financial_assumptions_normalized
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admin can manage Benchmarks" ON public.benchmarks_ratios
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Función para actualizar ratios
CREATE OR REPLACE FUNCTION public.refresh_ratios_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.fs_ratios_mv;
END;
$$;