-- Create inflation_rates table
CREATE TABLE public.inflation_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_date DATE NOT NULL,
  region TEXT NOT NULL DEFAULT 'EU',
  inflation_rate NUMERIC(5,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'ECB',
  data_type TEXT NOT NULL DEFAULT 'annual', -- annual, monthly, quarterly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inflation_rates ENABLE ROW LEVEL SECURITY;

-- Create policies - inflation data is public but only admins can modify
CREATE POLICY "Anyone can view inflation rates" 
ON public.inflation_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can modify inflation rates" 
ON public.inflation_rates 
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for better performance
CREATE INDEX idx_inflation_rates_period_region ON public.inflation_rates(period_date, region);
CREATE INDEX idx_inflation_rates_source ON public.inflation_rates(source);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_inflation_rates_updated_at
BEFORE UPDATE ON public.inflation_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample EU inflation data for testing
INSERT INTO public.inflation_rates (period_date, region, inflation_rate, source, data_type) VALUES
('2024-01-01', 'EU', 2.9, 'ECB', 'annual'),
('2024-02-01', 'EU', 2.6, 'ECB', 'annual'),
('2024-03-01', 'EU', 2.4, 'ECB', 'annual'),
('2024-04-01', 'EU', 2.4, 'ECB', 'annual'),
('2024-05-01', 'EU', 2.6, 'ECB', 'annual'),
('2024-06-01', 'EU', 2.5, 'ECB', 'annual'),
('2024-07-01', 'EU', 2.6, 'ECB', 'annual'),
('2024-08-01', 'EU', 2.2, 'ECB', 'annual'),
('2024-09-01', 'EU', 1.7, 'ECB', 'annual'),
('2024-10-01', 'EU', 2.0, 'ECB', 'annual'),
('2024-11-01', 'EU', 2.3, 'ECB', 'annual'),
('2024-12-01', 'EU', 2.4, 'ECB', 'annual');