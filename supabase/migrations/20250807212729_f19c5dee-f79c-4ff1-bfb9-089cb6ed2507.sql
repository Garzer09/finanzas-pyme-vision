-- Align template requirements per request: only Balance and PyG required; others optional
-- 1) Update template_schemas is_required flags
UPDATE public.template_schemas
SET is_required = CASE 
  WHEN name IN ('balance-situacion','cuenta-pyg') THEN true
  ELSE false
END,
updated_at = now();

-- 2) Ensure Balance template has a strict balance check rule and required fields rule present
UPDATE public.template_schemas
SET validation_rules = (
  SELECT jsonb_agg(DISTINCT x)
  FROM jsonb_array_elements(validation_rules) AS x
  UNION ALL
  SELECT to_jsonb(r) FROM (
    SELECT 
      'balance_check'::text AS type,
      'El total de Activo debe ser igual a Pasivo + Patrimonio'::text AS message,
      'error'::text AS severity
  ) r
  UNION ALL
  SELECT to_jsonb(r2) FROM (
    SELECT 
      'required_fields'::text AS type,
      'Todos los campos obligatorios deben estar completos'::text AS message,
      'error'::text AS severity
  ) r2
)
WHERE name = 'balance-situacion';

-- 3) Make Cash Flow optional (explicit safeguard)
UPDATE public.template_schemas
SET is_required = false
WHERE name = 'estado-flujos';

-- 4) Expand and refresh financial synonyms used by the intelligent-data-mapper
-- Remove existing rows for these canonical terms to avoid duplicates, then reinsert enriched sets
DELETE FROM public.financial_synonyms 
WHERE canonical_term IN (
  'ventas','ingresos','cifra_negocio','beneficio_bruto','coste_ventas',
  'ebitda','resultado_explotacion','tesoreria','caja','activo_total',
  'pasivo_total','patrimonio_neto','deuda_financiera','ingresos_financieros',
  'gastos_financieros','margen_ebitda','margen_neto'
);

-- Income statement core terms
INSERT INTO public.financial_synonyms (canonical_term, synonyms, category, confidence_score)
VALUES
  ('ventas', ARRAY['ingresos','cifra_negocio','facturacion','revenue','sales','net_sales','ingresos_operativos','importe_neto_cifra_negocios'], 'income_statement', 1.0),
  ('beneficio_bruto', ARRAY['margen_bruto','gross_profit','resultado_bruto'], 'income_statement', 0.95),
  ('coste_ventas', ARRAY['costo_ventas','cost_of_sales','coste_mercaderias','cogs','consumo'], 'income_statement', 0.95),
  ('resultado_explotacion', ARRAY['resultado_operativo','operating_income','ebit','resultado_actividad_ordinaria'], 'income_statement', 0.95),
  ('ebitda', ARRAY['resultado_explotacion_amortizaciones','earnings_before_interest_taxes_depreciation_amortization','resultado_antes_de_intereses_impuestos_depreciacion_y_amortizacion'], 'income_statement', 0.95),
  ('ingresos_financieros', ARRAY['financial_income','intereses_cobrados','ingresos_por_intereses'], 'income_statement', 0.9),
  ('gastos_financieros', ARRAY['financial_expenses','intereses_pagados','gastos_por_intereses'], 'income_statement', 0.9),
  ('margen_ebitda', ARRAY['ebitda_margin','margen_sobre_ventas_ebitda'], 'ratio', 0.9),
  ('margen_neto', ARRAY['net_margin','margen_sobre_ventas_neto'], 'ratio', 0.9);

-- Balance sheet core terms
INSERT INTO public.financial_synonyms (canonical_term, synonyms, category, confidence_score)
VALUES
  ('tesoreria', ARRAY['caja','bancos','disponible','efectivo','cash','cash_and_equivalents'], 'balance_sheet', 0.95),
  ('activo_total', ARRAY['total_activo','total_assets','activo'], 'balance_sheet', 1.0),
  ('pasivo_total', ARRAY['total_pasivo','total_liabilities','pasivo'], 'balance_sheet', 1.0),
  ('patrimonio_neto', ARRAY['fondos_propios','equity','patrimonio','capital','net_worth'], 'balance_sheet', 1.0),
  ('deuda_financiera', ARRAY['prestamos','creditos','financial_debt','debt','deuda_bancaria','deuda_intereses'], 'balance_sheet', 0.95);

-- 5) Ensure optional templates explicitly flagged as optional
UPDATE public.template_schemas
SET is_required = false
WHERE name IN ('datos-operativos','empresa-cualitativa','pool-deuda','pool-deuda-vencimientos','supuestos-financieros');

-- 6) Keep wide/long flexibility note inside schema_definition by toggling allowAdditionalColumns if missing
UPDATE public.template_schemas
SET schema_definition = jsonb_set(
  schema_definition::jsonb,
  '{allowAdditionalColumns}',
  'true'::jsonb,
  true
),
updated_at = now()
WHERE (schema_definition::jsonb -> 'allowAdditionalColumns') IS NULL;