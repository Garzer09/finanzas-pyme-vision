-- Migrate existing CSV templates from /public/templates/ to template_schemas
-- This script creates template schemas based on the current static CSV files

-- Insert Balance de Situación template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'balance-situacion',
  'Balance de Situación',
  'Balance sheet template with assets, liabilities and equity',
  'financial',
  true,
  '{
    "columns": [
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "Financial concept or account name"
      },
      {
        "name": "2022",
        "type": "number",
        "required": false,
        "description": "Values for year 2022",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "2023",
        "type": "number",
        "required": false,
        "description": "Values for year 2023",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "2024",
        "type": "number",
        "required": false,
        "description": "Values for year 2024",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "Notas",
        "type": "text",
        "required": false,
        "description": "Notes and comments"
      }
    ],
    "variableYearColumns": true,
    "yearColumnPattern": "^[0-9]{4}$",
    "expectedConcepts": [
      "Inmovilizado intangible",
      "Inmovilizado material",
      "Inversiones inmobiliarias",
      "Inversiones financieras a largo plazo",
      "Activos por impuesto diferido",
      "Existencias",
      "Deudores comerciales y otras cuentas a cobrar",
      "Inversiones financieras a corto plazo",
      "Periodificaciones a corto plazo",
      "Efectivo y otros activos líquidos equivalentes"
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Concepto"],
      "message": "El campo Concepto es obligatorio"
    },
    {
      "type": "balance_check",
      "description": "Total Activo debe ser aproximadamente igual a Patrimonio Neto + Total Pasivo",
      "tolerance": 0.01,
      "message": "Debe cumplirse: Total Activo ≈ Patrimonio Neto + Total Pasivo (±0,01)"
    },
    {
      "type": "format",
      "field": "Concepto",
      "rule": "no_empty",
      "message": "Los conceptos no pueden estar vacíos"
    }
  ]'
);

-- Insert Cuenta de Pérdidas y Ganancias template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'cuenta-pyg',
  'Cuenta de Pérdidas y Ganancias',
  'Profit and Loss statement template',
  'financial',
  true,
  '{
    "columns": [
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "P&L concept or account name"
      },
      {
        "name": "2022",
        "type": "number",
        "required": false,
        "description": "Values for year 2022",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "2023",
        "type": "number",
        "required": false,
        "description": "Values for year 2023",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "2024",
        "type": "number",
        "required": false,
        "description": "Values for year 2024",
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      },
      {
        "name": "Notas",
        "type": "text",
        "required": false,
        "description": "Notes and comments"
      }
    ],
    "variableYearColumns": true,
    "yearColumnPattern": "^[0-9]{4}$",
    "expectedConcepts": [
      "Cifra de negocios",
      "Variación de existencias de productos terminados",
      "Trabajos realizados por la empresa para su activo",
      "Aprovisionamientos (compras)",
      "Otros ingresos de explotación",
      "Gastos de personal",
      "Otros gastos de explotación",
      "Amortización del inmovilizado"
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Concepto"],
      "message": "El campo Concepto es obligatorio"
    },
    {
      "type": "format",
      "field": "Concepto",
      "rule": "no_empty",
      "message": "Los conceptos no pueden estar vacíos"
    },
    {
      "type": "calculation_check",
      "description": "Verificar que no se incluyan cálculos como EBIT/EBITDA/BAI",
      "message": "No incluir EBIT/EBITDA/BAI/márgenes. Importes en punto decimal, sin miles."
    }
  ]'
);

-- Insert Pool de Deuda template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'pool-deuda',
  'Pool de Deuda',
  'Debt pool information template',
  'financial',
  false,
  '{
    "columns": [
      {
        "name": "Entidad",
        "type": "text",
        "required": true,
        "description": "Financial institution or lender name"
      },
      {
        "name": "Tipo_Financiacion",
        "type": "text",
        "required": true,
        "description": "Type of financing (loan, credit line, etc.)"
      },
      {
        "name": "Importe_Inicial",
        "type": "number",
        "required": true,
        "description": "Initial amount",
        "validations": [
          {"type": "range", "min": 0, "max": 999999999}
        ]
      },
      {
        "name": "Tipo_Interes",
        "type": "number",
        "required": false,
        "description": "Interest rate",
        "validations": [
          {"type": "range", "min": 0, "max": 100}
        ]
      },
      {
        "name": "Vencimiento",
        "type": "date",
        "required": false,
        "description": "Maturity date"
      },
      {
        "name": "Moneda",
        "type": "text",
        "required": false,
        "description": "Currency code"
      },
      {
        "name": "Garantias",
        "type": "text",
        "required": false,
        "description": "Guarantees or collateral"
      }
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Entidad", "Tipo_Financiacion", "Importe_Inicial"],
      "message": "Entidad, Tipo_Financiacion e Importe_Inicial son obligatorios"
    }
  ]'
);

-- Insert Pool de Deuda Vencimientos template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'pool-deuda-vencimientos',
  'Vencimientos de Deuda',
  'Debt maturity schedule template',
  'financial',
  false,
  '{
    "columns": [
      {
        "name": "Entidad",
        "type": "text",
        "required": true,
        "description": "Financial institution or lender name"
      },
      {
        "name": "Tipo_Financiacion",
        "type": "text",
        "required": true,
        "description": "Type of financing"
      },
      {
        "name": "Año",
        "type": "number",
        "required": true,
        "description": "Year",
        "validations": [
          {"type": "range", "min": 2020, "max": 2050}
        ]
      },
      {
        "name": "Principal",
        "type": "number",
        "required": false,
        "description": "Principal payment",
        "validations": [
          {"type": "range", "min": 0, "max": 999999999}
        ]
      },
      {
        "name": "Intereses",
        "type": "number",
        "required": false,
        "description": "Interest payment",
        "validations": [
          {"type": "range", "min": 0, "max": 999999999}
        ]
      },
      {
        "name": "Total",
        "type": "number",
        "required": false,
        "description": "Total payment",
        "validations": [
          {"type": "range", "min": 0, "max": 999999999}
        ]
      }
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Entidad", "Tipo_Financiacion", "Año"],
      "message": "Entidad, Tipo_Financiacion y Año son obligatorios"
    },
    {
      "type": "calculation",
      "formula": "Principal + Intereses = Total",
      "tolerance": 0.01,
      "message": "Total debe ser igual a Principal + Intereses"
    }
  ]'
);

-- Insert Estado de Flujos template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'estado-flujos',
  'Estado de Flujos de Efectivo',
  'Cash flow statement template',
  'financial',
  false,
  '{
    "columns": [
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "Cash flow concept"
      },
      {
        "name": "Categoria",
        "type": "text",
        "required": false,
        "description": "Category (operating, investing, financing)"
      },
      {
        "name": "2022",
        "type": "number",
        "required": false,
        "description": "Values for year 2022"
      },
      {
        "name": "2023",
        "type": "number",
        "required": false,
        "description": "Values for year 2023"
      },
      {
        "name": "2024",
        "type": "number",
        "required": false,
        "description": "Values for year 2024"
      }
    ],
    "variableYearColumns": true,
    "yearColumnPattern": "^[0-9]{4}$"
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Concepto"],
      "message": "El campo Concepto es obligatorio"
    }
  ]'
);

-- Insert Datos Operativos template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'datos-operativos',
  'Datos Operativos',
  'Operational data and KPIs template',
  'operational',
  false,
  '{
    "columns": [
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "Operational concept or KPI name"
      },
      {
        "name": "Unidad",
        "type": "text",
        "required": false,
        "description": "Unit of measurement"
      },
      {
        "name": "2022",
        "type": "number",
        "required": false,
        "description": "Values for year 2022"
      },
      {
        "name": "2023",
        "type": "number",
        "required": false,
        "description": "Values for year 2023"
      },
      {
        "name": "2024",
        "type": "number",
        "required": false,
        "description": "Values for year 2024"
      }
    ],
    "variableYearColumns": true,
    "yearColumnPattern": "^[0-9]{4}$"
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Concepto"],
      "message": "El campo Concepto es obligatorio"
    }
  ]'
);

-- Insert Supuestos Financieros template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'supuestos-financieros',
  'Supuestos Financieros',
  'Financial assumptions and projections template',
  'financial',
  false,
  '{
    "columns": [
      {
        "name": "Categoria",
        "type": "text",
        "required": true,
        "description": "Assumption category"
      },
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "Assumption concept"
      },
      {
        "name": "Valor",
        "type": "number",
        "required": false,
        "description": "Assumption value"
      },
      {
        "name": "Unidad",
        "type": "text",
        "required": false,
        "description": "Unit (%, €, ratio, etc.)"
      },
      {
        "name": "Notas",
        "type": "text",
        "required": false,
        "description": "Notes and explanations"
      }
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["Categoria", "Concepto"],
      "message": "Categoria y Concepto son obligatorios"
    }
  ]'
);

-- Insert Empresa Cualitativa template
INSERT INTO public.template_schemas (
  name,
  display_name,
  description,
  category,
  is_required,
  schema_definition,
  validation_rules
) VALUES (
  'empresa-cualitativa',
  'Información Cualitativa de la Empresa',
  'Company qualitative information template',
  'qualitative',
  false,
  '{
    "columns": [
      {
        "name": "company_name",
        "type": "text",
        "required": true,
        "description": "Company name"
      },
      {
        "name": "sector",
        "type": "text",
        "required": false,
        "description": "Business sector"
      },
      {
        "name": "industry",
        "type": "text",
        "required": false,
        "description": "Industry classification"
      },
      {
        "name": "founded_year",
        "type": "number",
        "required": false,
        "description": "Year founded",
        "validations": [
          {"type": "range", "min": 1800, "max": 2030}
        ]
      },
      {
        "name": "employees_range",
        "type": "text",
        "required": false,
        "description": "Employee count range"
      },
      {
        "name": "annual_revenue_range",
        "type": "text",
        "required": false,
        "description": "Annual revenue range"
      },
      {
        "name": "hq_city",
        "type": "text",
        "required": false,
        "description": "Headquarters city"
      },
      {
        "name": "hq_country",
        "type": "text",
        "required": false,
        "description": "Headquarters country"
      },
      {
        "name": "website",
        "type": "text",
        "required": false,
        "description": "Company website"
      },
      {
        "name": "business_description",
        "type": "text",
        "required": false,
        "description": "Business description"
      },
      {
        "name": "currency_code",
        "type": "text",
        "required": false,
        "description": "Currency code (EUR, USD, etc.)"
      },
      {
        "name": "accounting_standard",
        "type": "text",
        "required": false,
        "description": "Accounting standard (GAAP, IFRS, etc.)"
      },
      {
        "name": "consolidation",
        "type": "text",
        "required": false,
        "description": "Consolidation method"
      },
      {
        "name": "cif",
        "type": "text",
        "required": false,
        "description": "Tax identification number"
      }
    ]
  }',
  '[
    {
      "type": "required_fields",
      "fields": ["company_name"],
      "message": "El nombre de la empresa es obligatorio"
    }
  ]'
);

-- Create initial template versions for all schemas
INSERT INTO public.template_versions (template_schema_id, version_number, schema_definition, validation_rules, change_summary, is_published, created_by)
SELECT 
  id,
  1,
  schema_definition,
  validation_rules,
  'Initial version migrated from static CSV templates',
  true,
  NULL
FROM public.template_schemas
WHERE name IN (
  'balance-situacion', 'cuenta-pyg', 'pool-deuda', 'pool-deuda-vencimientos',
  'estado-flujos', 'datos-operativos', 'supuestos-financieros', 'empresa-cualitativa'
);