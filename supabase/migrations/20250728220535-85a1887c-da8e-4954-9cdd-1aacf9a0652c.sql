-- CRITICAL SECURITY FIX: Re-enable RLS on client_configurations table
-- This table currently has RLS disabled, allowing unrestricted access

ALTER TABLE public.client_configurations ENABLE ROW LEVEL SECURITY;

-- Verify existing policies are still in place and working
-- The table should already have policies for users to manage their own configs
-- Let's also add a policy to ensure data integrity

-- Add policy to prevent unauthorized access if somehow the existing policies fail
CREATE POLICY "Ensure user ownership on client_configurations" 
ON public.client_configurations 
FOR ALL 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));