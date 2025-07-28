-- Add physical units data to financial_data table
ALTER TABLE public.financial_data 
ADD COLUMN physical_units_data JSONB DEFAULT '{}';

-- Create unit mappings table for normalization
CREATE TABLE public.unit_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_short_name TEXT NOT NULL,
  unit_full_name TEXT NOT NULL,
  unit_category TEXT NOT NULL, -- 'weight', 'volume', 'count', 'length', etc.
  conversion_factor NUMERIC DEFAULT 1.0,
  base_unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unit_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy for unit mappings (read-only for users)
CREATE POLICY "Anyone can view unit mappings" 
ON public.unit_mappings 
FOR SELECT 
USING (true);

-- Add physical units configuration to client_configurations
ALTER TABLE public.client_configurations 
ADD COLUMN default_physical_unit TEXT DEFAULT NULL,
ADD COLUMN has_physical_data BOOLEAN DEFAULT false;

-- Insert common unit mappings
INSERT INTO public.unit_mappings (unit_short_name, unit_full_name, unit_category, conversion_factor, base_unit) VALUES
('kg', 'kilogramos', 'weight', 1.0, 'kg'),
('g', 'gramos', 'weight', 0.001, 'kg'),
('t', 'toneladas', 'weight', 1000.0, 'kg'),
('l', 'litros', 'volume', 1.0, 'l'),
('ml', 'mililitros', 'volume', 0.001, 'l'),
('m³', 'metros cúbicos', 'volume', 1000.0, 'l'),
('ud', 'unidades', 'count', 1.0, 'ud'),
('pcs', 'piezas', 'count', 1.0, 'ud'),
('docenas', 'docenas', 'count', 12.0, 'ud'),
('m', 'metros', 'length', 1.0, 'm'),
('cm', 'centímetros', 'length', 0.01, 'm'),
('km', 'kilómetros', 'length', 1000.0, 'm');