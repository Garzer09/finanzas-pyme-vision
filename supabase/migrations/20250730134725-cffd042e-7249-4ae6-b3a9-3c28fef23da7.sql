-- Create table for storing company information from Perplexity
CREATE TABLE public.company_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  industry TEXT,
  founded_year INTEGER,
  employees TEXT,
  revenue TEXT,
  headquarters TEXT,
  website TEXT,
  products TEXT[],
  competitors TEXT[],
  key_facts TEXT[],
  market_position TEXT,
  business_model TEXT,
  raw_search_result TEXT,
  search_query TEXT,
  data_source TEXT DEFAULT 'perplexity',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own company description" 
ON public.company_descriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company description" 
ON public.company_descriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company description" 
ON public.company_descriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all company descriptions" 
ON public.company_descriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_descriptions_updated_at
BEFORE UPDATE ON public.company_descriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();