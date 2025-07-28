-- Add company_logo_url field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN company_logo_url TEXT;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- Create policies for company logos bucket
CREATE POLICY "Company logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-logos' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));

CREATE POLICY "Admins can delete company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-logos' AND (
  SELECT has_role(auth.uid(), 'admin'::app_role)
));