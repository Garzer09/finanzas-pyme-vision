-- Phase 1: Template Management Database Implementation
-- Create proper template schemas and management tables

-- Template Schemas table for dynamic template definitions
CREATE TABLE IF NOT EXISTS public.template_schemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'financial',
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  schema_definition JSONB NOT NULL DEFAULT '{}',
  validation_rules JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Template generation history
CREATE TABLE IF NOT EXISTS public.template_generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_schema_id UUID NOT NULL REFERENCES public.template_schemas(id),
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  generation_parameters JSONB NOT NULL DEFAULT '{}',
  generated_filename TEXT NOT NULL,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Company template customizations
CREATE TABLE IF NOT EXISTS public.company_template_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  template_schema_id UUID NOT NULL REFERENCES public.template_schemas(id),
  custom_display_name TEXT,
  custom_schema JSONB,
  custom_validations JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(company_id, template_schema_id)
);

-- Upload history for tracking file uploads and processing
CREATE TABLE IF NOT EXISTS public.upload_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_schema_id UUID REFERENCES public.template_schemas(id),
  template_name TEXT,
  original_filename TEXT NOT NULL,
  file_size INTEGER,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  detected_years INTEGER[] DEFAULT '{}',
  selected_years INTEGER[] DEFAULT '{}',
  validation_results JSONB DEFAULT '{}',
  file_metadata JSONB DEFAULT '{}',
  processing_logs JSONB DEFAULT '[]',
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.template_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_schemas
CREATE POLICY "Everyone can view active templates" ON public.template_schemas
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON public.template_schemas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- RLS Policies for template_generation_history  
CREATE POLICY "Users can view own generation history" ON public.template_generation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create generation history" ON public.template_generation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all generation history" ON public.template_generation_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- RLS Policies for company_template_customizations
CREATE POLICY "Admins can manage all customizations" ON public.company_template_customizations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Company members can view customizations" ON public.company_template_customizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships 
      WHERE user_id = auth.uid() AND company_id = company_template_customizations.company_id
    )
  );

-- RLS Policies for upload_history
CREATE POLICY "Users can view own uploads" ON public.upload_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create uploads" ON public.upload_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads" ON public.upload_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_schemas_name ON public.template_schemas(name);
CREATE INDEX IF NOT EXISTS idx_template_schemas_category ON public.template_schemas(category);
CREATE INDEX IF NOT EXISTS idx_template_schemas_active ON public.template_schemas(is_active);
CREATE INDEX IF NOT EXISTS idx_template_generation_company ON public.template_generation_history(company_id);
CREATE INDEX IF NOT EXISTS idx_template_generation_user ON public.template_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_customizations_company ON public.company_template_customizations(company_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_company ON public.upload_history(company_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_user ON public.upload_history(user_id);

-- Insert standard financial templates
INSERT INTO public.template_schemas (name, display_name, category, description, schema_definition, validation_rules, is_required) VALUES
('balance-situacion', 'Balance de Situación', 'financial', 'Plantilla estándar para el Balance de Situación con formato largo', 
 '{
   "columns": [
     {"name": "Concepto", "type": "text", "required": true, "description": "Concepto del balance"},
     {"name": "Seccion", "type": "text", "required": true, "description": "Activo, Pasivo o Patrimonio"},
     {"name": "Periodo", "type": "date", "required": true, "description": "Fecha del período"},
     {"name": "Año", "type": "integer", "required": true, "description": "Año del período"},
     {"name": "Importe", "type": "numeric", "required": true, "description": "Valor monetario"},
     {"name": "Moneda", "type": "text", "required": false, "description": "Código de moneda"}
   ],
   "variableYearColumns": false,
   "expectedConcepts": ["Activo Corriente", "Activo No Corriente", "Pasivo Corriente", "Pasivo No Corriente", "Patrimonio Neto"],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "balance_check", "message": "El total de Activo debe ser igual a Pasivo + Patrimonio", "severity": "error"},
   {"type": "required_fields", "message": "Todos los campos obligatorios deben estar completos", "severity": "error"}
 ]',
 true),

('cuenta-pyg', 'Cuenta de Pérdidas y Ganancias', 'financial', 'Plantilla estándar para la Cuenta de P&G con formato largo',
 '{
   "columns": [
     {"name": "Concepto", "type": "text", "required": true, "description": "Concepto de la cuenta P&G"},
     {"name": "Periodo", "type": "date", "required": true, "description": "Fecha del período"},
     {"name": "Año", "type": "integer", "required": true, "description": "Año del período"},
     {"name": "Importe", "type": "numeric", "required": true, "description": "Valor monetario"},
     {"name": "Moneda", "type": "text", "required": false, "description": "Código de moneda"}
   ],
   "variableYearColumns": false,
   "expectedConcepts": ["Ingresos de Explotación", "Gastos de Explotación", "Resultado de Explotación", "Resultado Financiero", "Resultado antes de Impuestos", "Impuesto sobre Beneficios", "Resultado del Ejercicio"],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "required_fields", "message": "Todos los campos obligatorios deben estar completos", "severity": "error"},
   {"type": "calculation_check", "message": "Los cálculos deben ser coherentes", "severity": "warning"}
 ]',
 true),

('estado-flujos', 'Estado de Flujos de Efectivo', 'financial', 'Plantilla estándar para el Estado de Flujos de Efectivo',
 '{
   "columns": [
     {"name": "Concepto", "type": "text", "required": true, "description": "Concepto del flujo"},
     {"name": "Categoria", "type": "text", "required": true, "description": "Operaciones, Inversión o Financiación"},
     {"name": "Periodo", "type": "date", "required": true, "description": "Fecha del período"},
     {"name": "Año", "type": "integer", "required": true, "description": "Año del período"},
     {"name": "Importe", "type": "numeric", "required": true, "description": "Valor monetario"},
     {"name": "Moneda", "type": "text", "required": false, "description": "Código de moneda"}
   ],
   "variableYearColumns": false,
   "expectedConcepts": ["Flujo de Operaciones", "Flujo de Inversión", "Flujo de Financiación", "Variación de Efectivo"],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "required_fields", "message": "Todos los campos obligatorios deben estar completos", "severity": "error"}
 ]',
 true),

('empresa-cualitativa', 'Información Cualitativa de la Empresa', 'qualitative', 'Plantilla para información corporativa y estructura accionarial',
 '{
   "columns": [
     {"name": "company_name", "type": "text", "required": true, "description": "Nombre de la empresa"},
     {"name": "sector", "type": "text", "required": false, "description": "Sector de actividad"},
     {"name": "industry", "type": "text", "required": false, "description": "Industria específica"},
     {"name": "founded_year", "type": "integer", "required": false, "description": "Año de fundación"},
     {"name": "employees_range", "type": "text", "required": false, "description": "Rango de empleados"},
     {"name": "hq_city", "type": "text", "required": false, "description": "Ciudad de la sede"},
     {"name": "website", "type": "text", "required": false, "description": "Sitio web"}
   ],
   "sections": ["EMPRESA", "ESTRUCTURA_ACCIONARIAL"],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "required_fields", "message": "Debe incluir al menos el nombre de la empresa", "severity": "error"}
 ]',
 false),

('pool-deuda', 'Pool de Deuda', 'financial', 'Plantilla para el detalle del pool de deuda',
 '{
   "columns": [
     {"name": "Entidad", "type": "text", "required": true, "description": "Entidad financiera"},
     {"name": "Tipo_Financiacion", "type": "text", "required": true, "description": "Tipo de financiación"},
     {"name": "Principal_Inicial", "type": "numeric", "required": true, "description": "Principal inicial"},
     {"name": "Tasa_Interes", "type": "numeric", "required": true, "description": "Tasa de interés"},
     {"name": "Vencimiento", "type": "date", "required": true, "description": "Fecha de vencimiento"},
     {"name": "Garantias", "type": "text", "required": false, "description": "Garantías asociadas"}
   ],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "required_fields", "message": "Todos los campos obligatorios deben estar completos", "severity": "error"}
 ]',
 false),

('datos-operativos', 'Datos Operativos', 'operational', 'Plantilla para métricas operativas',
 '{
   "columns": [
     {"name": "Metrica", "type": "text", "required": true, "description": "Nombre de la métrica"},
     {"name": "Valor", "type": "numeric", "required": true, "description": "Valor de la métrica"},
     {"name": "Unidad", "type": "text", "required": true, "description": "Unidad de medida"},
     {"name": "Periodo", "type": "date", "required": true, "description": "Período de la métrica"},
     {"name": "Segmento", "type": "text", "required": false, "description": "Segmento de negocio"}
   ],
   "allowAdditionalColumns": true,
   "delimiter": ","
 }',
 '[
   {"type": "required_fields", "message": "Todos los campos obligatorios deben estar completos", "severity": "error"}
 ]',
 false);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_schemas_updated_at
  BEFORE UPDATE ON public.template_schemas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_template_customizations_updated_at
  BEFORE UPDATE ON public.company_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_upload_history_updated_at
  BEFORE UPDATE ON public.upload_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();