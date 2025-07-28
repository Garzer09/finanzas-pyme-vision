-- Crear tabla para información de estructura accionaria
CREATE TABLE public.company_shareholder_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  shareholder_structure JSONB DEFAULT '[]'::jsonb,
  management_team JSONB DEFAULT '[]'::jsonb,
  board_of_directors JSONB DEFAULT '[]'::jsonb,
  key_investors JSONB DEFAULT '[]'::jsonb,
  founding_partners JSONB DEFAULT '[]'::jsonb,
  data_source TEXT DEFAULT 'manual', -- 'manual' | 'perplexity' | 'mixed'
  last_updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para historial de búsquedas con Perplexity
CREATE TABLE public.shareholder_search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  search_results JSONB NOT NULL,
  search_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'completed' -- 'pending' | 'completed' | 'failed'
);

-- Habilitar Row Level Security
ALTER TABLE public.company_shareholder_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareholder_search_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para company_shareholder_info
CREATE POLICY "Users can manage own shareholder info" 
ON public.company_shareholder_info 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para shareholder_search_history
CREATE POLICY "Users can manage own search history" 
ON public.shareholder_search_history 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_company_shareholder_info_updated_at
BEFORE UPDATE ON public.company_shareholder_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX idx_company_shareholder_info_user_id ON public.company_shareholder_info(user_id);
CREATE INDEX idx_company_shareholder_info_company_name ON public.company_shareholder_info(company_name);
CREATE INDEX idx_shareholder_search_history_user_id ON public.shareholder_search_history(user_id);
CREATE INDEX idx_shareholder_search_history_company_name ON public.shareholder_search_history(company_name);