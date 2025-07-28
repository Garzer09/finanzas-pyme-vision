-- Tabla para reglas de mapeo de datos
CREATE TABLE public.data_mapping_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transformation_logic JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para configuraciones por cliente
CREATE TABLE public.client_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  industry_sector TEXT,
  default_units TEXT DEFAULT 'euros',
  field_mappings JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  data_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para logs de calidad de datos
CREATE TABLE public.data_quality_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_id UUID,
  validation_type TEXT NOT NULL,
  validation_result JSONB NOT NULL,
  issues_found JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  confidence_score NUMERIC DEFAULT 0.0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para diccionario de sinónimos
CREATE TABLE public.financial_synonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL,
  category TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.data_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_synonyms ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para data_mapping_rules
CREATE POLICY "Users can manage own mapping rules" 
ON public.data_mapping_rules 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para client_configurations
CREATE POLICY "Users can manage own client configs" 
ON public.client_configurations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para data_quality_logs
CREATE POLICY "Users can manage own quality logs" 
ON public.data_quality_logs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para financial_synonyms (lectura pública, escritura restringida)
CREATE POLICY "Anyone can view financial synonyms" 
ON public.financial_synonyms 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify synonyms" 
ON public.financial_synonyms 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
CREATE TRIGGER update_data_mapping_rules_updated_at
  BEFORE UPDATE ON public.data_mapping_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_configurations_updated_at
  BEFORE UPDATE ON public.client_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar sinónimos financieros básicos
INSERT INTO public.financial_synonyms (canonical_term, synonyms, category) VALUES
('ventas', ARRAY['ingresos', 'cifra_negocio', 'facturacion', 'revenue', 'sales'], 'income_statement'),
('ebitda', ARRAY['resultado_explotacion_amortizaciones', 'ebitda', 'earnings_before'], 'income_statement'),
('tesoreria', ARRAY['caja', 'bancos', 'disponible', 'cash', 'treasury'], 'balance_sheet'),
('activo_total', ARRAY['total_activo', 'total_assets', 'activo'], 'balance_sheet'),
('patrimonio_neto', ARRAY['fondos_propios', 'equity', 'patrimonio', 'capital'], 'balance_sheet'),
('pasivo_total', ARRAY['total_pasivo', 'total_liabilities', 'pasivo'], 'balance_sheet'),
('deuda_financiera', ARRAY['prestamos', 'creditos', 'financial_debt', 'debt'], 'balance_sheet'),
('coste_ventas', ARRAY['costo_ventas', 'cost_of_sales', 'coste_mercancia'], 'income_statement'),
('gastos_personal', ARRAY['gastos_empleados', 'staff_costs', 'personal_expenses'], 'income_statement'),
('amortizaciones', ARRAY['depreciacion', 'depreciation', 'amortization'], 'income_statement');