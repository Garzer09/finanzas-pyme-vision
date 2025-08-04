-- Create organization field mappings table
CREATE TABLE public.organization_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  field_mappings JSONB NOT NULL DEFAULT '{}',
  confidence_threshold NUMERIC DEFAULT 0.8,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, profile_name)
);

-- Enable RLS
ALTER TABLE public.organization_field_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own org mappings" 
ON public.organization_field_mappings
FOR ALL 
USING (org_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (org_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_organization_field_mappings_updated_at
BEFORE UPDATE ON public.organization_field_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();