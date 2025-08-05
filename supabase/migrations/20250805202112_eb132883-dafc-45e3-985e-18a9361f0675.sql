-- Create company_module_access table for granular module permissions
CREATE TABLE public.company_module_access (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, module_id)
);

-- Enable RLS
ALTER TABLE public.company_module_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage company module access" 
ON public.company_module_access 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM admins WHERE admins.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_company_module_access_updated_at
  BEFORE UPDATE ON public.company_module_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default module access for existing companies
INSERT INTO public.company_module_access (company_id, module_id, enabled)
SELECT 
  c.id,
  module_id,
  true
FROM public.companies c
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('balance-actual'),
    ('pyg-actual'),
    ('ratios-financieros'),
    ('cash-flow'),
    ('pyg-proyectado'),
    ('balance-proyectado'),
    ('sensibilidad'),
    ('pool-deuda'),
    ('servicio-deuda'),
    ('valoracion'),
    ('nof-analysis'),
    ('breakeven'),
    ('conclusiones')
) AS modules(module_id)
ON CONFLICT (company_id, module_id) DO NOTHING;