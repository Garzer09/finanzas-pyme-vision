-- Crear tabla para configuraciones de usuario relacionadas con periodos
CREATE TABLE public.user_period_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  configuration_type text NOT NULL DEFAULT 'period_selection',
  periods_selected jsonb NOT NULL DEFAULT '[]',
  comparison_enabled boolean DEFAULT false,
  comparison_periods jsonb DEFAULT '[]',
  default_period text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_period_configurations ENABLE ROW LEVEL SECURITY;

-- Crear políticas para user_period_configurations
CREATE POLICY "Users can manage own period configurations" 
ON public.user_period_configurations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Crear tabla para almacenar periodos detectados por archivo
CREATE TABLE public.detected_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid,
  user_id uuid NOT NULL,
  period_date date NOT NULL,
  period_type text NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
  period_label text NOT NULL,
  is_selected boolean DEFAULT true,
  confidence_score numeric DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS  
ALTER TABLE public.detected_periods ENABLE ROW LEVEL SECURITY;

-- Crear políticas para detected_periods
CREATE POLICY "Users can manage own detected periods" 
ON public.detected_periods 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Crear trigger para actualizar updated_at en user_period_configurations
CREATE TRIGGER update_user_period_configurations_updated_at
BEFORE UPDATE ON public.user_period_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar columnas a financial_data para mejorar tracking de periodos
ALTER TABLE public.financial_data 
ADD COLUMN IF NOT EXISTS period_year integer,
ADD COLUMN IF NOT EXISTS period_month integer,
ADD COLUMN IF NOT EXISTS period_quarter integer;

-- Crear índices para mejorar performance
CREATE INDEX idx_detected_periods_user_id ON public.detected_periods(user_id);
CREATE INDEX idx_detected_periods_file_id ON public.detected_periods(file_id);
CREATE INDEX idx_user_period_configurations_user_id ON public.user_period_configurations(user_id);
CREATE INDEX idx_financial_data_period_year ON public.financial_data(period_year);
CREATE INDEX idx_financial_data_period_month ON public.financial_data(period_month);