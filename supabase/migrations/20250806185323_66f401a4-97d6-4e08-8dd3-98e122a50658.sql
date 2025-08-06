-- Create processing_logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.processing_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  user_id uuid NOT NULL,
  step_name text NOT NULL,
  step_status text NOT NULL CHECK (step_status IN ('started', 'completed', 'failed', 'warning')),
  step_data jsonb DEFAULT '{}',
  error_details jsonb DEFAULT '{}',
  performance_metrics jsonb DEFAULT '{}',
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all processing logs" 
ON public.processing_logs 
FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Users can view own processing logs" 
ON public.processing_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_processing_logs_session_id ON public.processing_logs(session_id);
CREATE INDEX idx_processing_logs_user_id ON public.processing_logs(user_id);
CREATE INDEX idx_processing_logs_timestamp ON public.processing_logs(timestamp);

-- Create table for validation rules
CREATE TABLE IF NOT EXISTS public.template_validation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('format', 'range', 'required', 'pattern', 'custom')),
  metric_code text,
  record_type text,
  validation_config jsonb NOT NULL DEFAULT '{}',
  error_message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('error', 'warning', 'info')) DEFAULT 'error',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for validation rules
ALTER TABLE public.template_validation_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for validation rules
CREATE POLICY "Admins can manage validation rules" 
ON public.template_validation_rules 
FOR ALL 
USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Everyone can view active validation rules" 
ON public.template_validation_rules 
FOR SELECT 
USING (is_active = true);

-- Create function to log processing steps
CREATE OR REPLACE FUNCTION public.log_processing_step(
  _session_id uuid,
  _company_id uuid,
  _user_id uuid,
  _step_name text,
  _step_status text,
  _step_data jsonb DEFAULT '{}',
  _error_details jsonb DEFAULT '{}',
  _performance_metrics jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.processing_logs (
    session_id, company_id, user_id, step_name, step_status,
    step_data, error_details, performance_metrics
  ) VALUES (
    _session_id, _company_id, _user_id, _step_name, _step_status,
    _step_data, _error_details, _performance_metrics
  );
END;
$$;