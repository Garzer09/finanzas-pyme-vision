-- Update RLS policies for client_configurations to allow admins to create configs for other users

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own client configs" ON public.client_configurations;

-- Create separate policies for better control
CREATE POLICY "Users can view own client configs" 
ON public.client_configurations 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own client configs" 
ON public.client_configurations 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own client configs or admins can insert all" 
ON public.client_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own client configs or admins can delete all" 
ON public.client_configurations 
FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));