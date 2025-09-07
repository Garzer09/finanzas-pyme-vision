-- Create memberships table if it doesn't exist to fix the relationship error
CREATE TABLE IF NOT EXISTS public.memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own memberships" ON public.memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships" ON public.memberships
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create template_schemas table if it doesn't exist (needed for enhanced-template-processor)
CREATE TABLE IF NOT EXISTS public.template_schemas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    schema_definition JSONB NOT NULL DEFAULT '{}',
    validation_rules JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on template_schemas
ALTER TABLE public.template_schemas ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active templates
CREATE POLICY "Everyone can read active templates" ON public.template_schemas
    FOR SELECT USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates" ON public.template_schemas
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert standard templates for the enhanced processor
INSERT INTO public.template_schemas (name, display_name, description, schema_definition, validation_rules)
VALUES 
('balance-situacion', 'Balance de Situación', 'Template para estados de balance', 
 '{"columns": [{"name": "concepto", "type": "text", "required": true}, {"name": "2022", "type": "numeric", "required": false}, {"name": "2023", "type": "numeric", "required": false}, {"name": "2024", "type": "numeric", "required": false}], "variableYearColumns": true, "yearColumnPattern": "^[0-9]{4}$"}', 
 '[{"type": "numeric_range", "columns": ["2022", "2023", "2024"]}]'),
('cuenta-pyg', 'Cuenta de Pérdidas y Ganancias', 'Template para cuenta de resultados', 
 '{"columns": [{"name": "concepto", "type": "text", "required": true}, {"name": "2022", "type": "numeric", "required": false}, {"name": "2023", "type": "numeric", "required": false}, {"name": "2024", "type": "numeric", "required": false}], "variableYearColumns": true, "yearColumnPattern": "^[0-9]{4}$"}', 
 '[{"type": "numeric_range", "columns": ["2022", "2023", "2024"]}]'),
('estado-flujos', 'Estado de Flujos de Efectivo', 'Template para estados de flujos', 
 '{"columns": [{"name": "concepto", "type": "text", "required": true}, {"name": "2022", "type": "numeric", "required": false}, {"name": "2023", "type": "numeric", "required": false}, {"name": "2024", "type": "numeric", "required": false}], "variableYearColumns": true, "yearColumnPattern": "^[0-9]{4}$"}', 
 '[{"type": "numeric_range", "columns": ["2022", "2023", "2024"]}]'),
('pool-deuda', 'Pool de Deuda', 'Template para información de deuda', 
 '{"columns": [{"name": "entidad", "type": "text", "required": true}, {"name": "tipo", "type": "text", "required": true}, {"name": "capital", "type": "numeric", "required": true}, {"name": "tir", "type": "numeric", "required": false}], "variableYearColumns": false}', 
 '[{"type": "required_fields", "columns": ["entidad", "tipo", "capital"]}]'),
('datos-operativos', 'Datos Operativos', 'Template para datos operativos', 
 '{"columns": [{"name": "concepto", "type": "text", "required": true}, {"name": "2022", "type": "numeric", "required": false}, {"name": "2023", "type": "numeric", "required": false}, {"name": "2024", "type": "numeric", "required": false}], "variableYearColumns": true, "yearColumnPattern": "^[0-9]{4}$"}', 
 '[{"type": "numeric_range", "columns": ["2022", "2023", "2024"]}]')
ON CONFLICT (name) DO NOTHING;

-- Create upload_history table if it doesn't exist (needed for enhanced-template-processor)
CREATE TABLE IF NOT EXISTS public.upload_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    template_schema_id UUID REFERENCES public.template_schemas(id),
    template_name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER,
    upload_status TEXT NOT NULL DEFAULT 'pending',
    detected_years INTEGER[] DEFAULT '{}',
    selected_years INTEGER[] DEFAULT '{}',
    validation_results JSONB DEFAULT '{}',
    file_metadata JSONB DEFAULT '{}',
    company_id UUID REFERENCES public.companies(id),
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on upload_history
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own uploads
CREATE POLICY "Users can manage own uploads" ON public.upload_history
    FOR ALL USING (auth.uid() = user_id);

-- Admins can see all uploads
CREATE POLICY "Admins can see all uploads" ON public.upload_history
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));