-- Fix is_required flags as requested
UPDATE public.template_schemas
SET is_required = CASE WHEN name IN ('balance-situacion','cuenta-pyg') THEN true ELSE false END,
    updated_at = now();

-- Ensure balance has balance_check and required_fields rules by appending (duplicates harmless)
UPDATE public.template_schemas
SET validation_rules = (validation_rules::jsonb) || (
  '[
    {"type":"balance_check","message":"El total de Activo debe ser igual a Pasivo + Patrimonio","severity":"error"},
    {"type":"required_fields","message":"Todos los campos obligatorios deben estar completos","severity":"error"}
  ]'::jsonb
)
WHERE name = 'balance-situacion';

-- Explicitly ensure Cash Flow optional
UPDATE public.template_schemas SET is_required = false WHERE name = 'estado-flujos';

-- Expand financial synonyms: delete targeted canonicals and reinsert enriched lists
DELETE FROM public.financial_synonyms 
WHERE canonical_term IN (
  'ventas','ingresos','cifra_negocio','beneficio_bruto','coste_ventas',
  'ebitda','resultado_explotacion','tesoreria','caja','activo_total',
  'pasivo_total','patrimonio_neto','deuda_financiera','ingresos_financieros',
  'gastos_financieros','margen_ebitda','margen_neto'
);

INSERT INTO public.financial_synonyms (canonical_term, synonyms, category, confidence_score)
VALUES
  -- Income statement
  ('ventas', ARRAY['ingresos','cifra_negocio','facturacion','revenue','sales','net_sales','ingresos_operativos','importe_neto_cifra_negocios'], 'income_statement', 1.0),
  ('beneficio_bruto', ARRAY['margen_bruto','gross_profit','resultado_bruto'], 'income_statement', 0.95),
  ('coste_ventas', ARRAY['costo_ventas','cost_of_sales','coste_mercaderias','cogs','consumo'], 'income_statement', 0.95),
  ('resultado_explotacion', ARRAY['resultado_operativo','operating_income','ebit','resultado_actividad_ordinaria'], 'income_statement', 0.95),
  ('ebitda', ARRAY['resultado_explotacion_amortizaciones','earnings_before_interest_taxes_depreciation_amortization','resultado_antes_de_intereses_impuestos_depreciacion_y_amortizacion'], 'income_statement', 0.95),
  ('ingresos_financieros', ARRAY['financial_income','intereses_cobrados','ingresos_por_intereses'], 'income_statement', 0.9),
  ('gastos_financieros', ARRAY['financial_expenses','intereses_pagados','gastos_por_intereses'], 'income_statement', 0.9),
  ('margen_ebitda', ARRAY['ebitda_margin','margen_sobre_ventas_ebitda'], 'ratio', 0.9),
  ('margen_neto', ARRAY['net_margin','margen_sobre_ventas_neto'], 'ratio', 0.9),
  -- Balance sheet
  ('tesoreria', ARRAY['caja','bancos','disponible','efectivo','cash','cash_and_equivalents'], 'balance_sheet', 0.95),
  ('activo_total', ARRAY['total_activo','total_assets','activo'], 'balance_sheet', 1.0),
  ('pasivo_total', ARRAY['total_pasivo','total_liabilities','pasivo'], 'balance_sheet', 1.0),
  ('patrimonio_neto', ARRAY['fondos_propios','equity','patrimonio','capital','net_worth'], 'balance_sheet', 1.0),
  ('deuda_financiera', ARRAY['prestamos','creditos','financial_debt','debt','deuda_bancaria','deuda_intereses'], 'balance_sheet', 0.95);

-- Mark other known templates as optional
UPDATE public.template_schemas
SET is_required = false
WHERE name IN ('datos-operativos','empresa-cualitativa','pool-deuda','pool-deuda-vencimientos','supuestos-financieros');

-- Ensure allowAdditionalColumns flag exists
UPDATE public.template_schemas
SET schema_definition = jsonb_set(schema_definition::jsonb, '{allowAdditionalColumns}', 'true'::jsonb, true),
    updated_at = now()
WHERE (schema_definition::jsonb -> 'allowAdditionalColumns') IS NULL;