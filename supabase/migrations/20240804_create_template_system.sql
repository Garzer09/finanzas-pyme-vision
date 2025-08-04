-- Create dynamic template system for CSV templates
-- This migration creates the infrastructure for dynamic, configurable CSV templates

-- Template schemas table - stores the structure and validation rules for each template type
CREATE TABLE public.template_schemas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- e.g., 'balance-situacion', 'cuenta-pyg'
  display_name text NOT NULL, -- e.g., 'Balance de Situación', 'Cuenta de Pérdidas y Ganancias'
  description text,
  category text NOT NULL DEFAULT 'financial', -- 'financial', 'operational', 'qualitative'
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT false,
  
  -- Schema definition in JSON format
  schema_definition jsonb NOT NULL,
  /* Schema definition structure:
  {
    "columns": [
      {
        "name": "Concepto",
        "type": "text",
        "required": true,
        "description": "Description of the financial concept"
      },
      {
        "name": "2022",
        "type": "number",
        "required": false,
        "validations": [
          {"type": "range", "min": -999999999, "max": 999999999}
        ]
      }
    ],
    "validations": [
      {
        "type": "balance_check",
        "rule": "sum(assets) = sum(liabilities + equity)",
        "tolerance": 0.01
      }
    ]
  }
  */
  
  -- Validation rules specific to this template
  validation_rules jsonb NOT NULL DEFAULT '[]',
  /* Validation rules structure:
  [
    {
      "type": "required_fields",
      "fields": ["Concepto"],
      "message": "Concepto field is required"
    },
    {
      "type": "balance_check", 
      "description": "Assets must equal liabilities plus equity",
      "tolerance": 0.01
    },
    {
      "type": "calculation",
      "formula": "revenue - expenses",
      "target_field": "net_income"
    }
  ]
  */
  
  -- Metadata
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(name, version)
);

-- Company template customizations - allows companies to customize templates
CREATE TABLE public.company_template_customizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  template_schema_id uuid NOT NULL REFERENCES public.template_schemas(id) ON DELETE CASCADE,
  
  -- Customization data
  custom_schema jsonb, -- Overrides for schema_definition
  custom_validations jsonb, -- Additional or modified validation rules
  custom_display_name text, -- Company-specific template name
  notes text,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, template_schema_id)
);

-- Upload history with enhanced metadata
CREATE TABLE public.upload_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid,
  user_id uuid,
  
  -- Template information
  template_schema_id uuid REFERENCES public.template_schemas(id),
  template_name text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint,
  file_hash text, -- For deduplication
  
  -- Processing information
  upload_status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processing_job_id text,
  detected_years integer[],
  selected_years integer[],
  
  -- Validation results
  validation_results jsonb,
  /* Validation results structure:
  {
    "is_valid": true,
    "errors": [],
    "warnings": [],
    "statistics": {
      "total_rows": 100,
      "valid_rows": 95,
      "invalid_rows": 5
    }
  }
  */
  
  -- File metadata
  file_metadata jsonb,
  /* File metadata structure:
  {
    "delimiter": ",",
    "encoding": "utf-8",
    "headers": ["Concepto", "2022", "2023", "2024", "Notas"],
    "row_count": 100,
    "column_count": 5
  }
  */
  
  -- Timestamps
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Template versions table for version control
CREATE TABLE public.template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_schema_id uuid NOT NULL REFERENCES public.template_schemas(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  schema_definition jsonb NOT NULL,
  validation_rules jsonb NOT NULL DEFAULT '[]',
  change_summary text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(template_schema_id, version_number)
);

-- Enable Row Level Security
ALTER TABLE public.template_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_schemas
CREATE POLICY "Anyone can read active template schemas" 
ON public.template_schemas 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage template schemas" 
ON public.template_schemas 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS Policies for company_template_customizations
CREATE POLICY "Users can read own company customizations" 
ON public.company_template_customizations 
FOR SELECT 
USING (
  company_id IN (
    SELECT id FROM public.companies 
    WHERE companies.created_by = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can manage own company customizations" 
ON public.company_template_customizations 
FOR ALL 
USING (
  company_id IN (
    SELECT id FROM public.companies 
    WHERE companies.created_by = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for upload_history
CREATE POLICY "Users can read own upload history" 
ON public.upload_history 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can create own uploads" 
ON public.upload_history 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own uploads" 
ON public.upload_history 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- RLS Policies for template_versions
CREATE POLICY "Anyone can read published template versions" 
ON public.template_versions 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage template versions" 
ON public.template_versions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Update triggers
CREATE TRIGGER update_template_schemas_updated_at
BEFORE UPDATE ON public.template_schemas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_template_customizations_updated_at
BEFORE UPDATE ON public.company_template_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_template_schemas_name ON public.template_schemas(name);
CREATE INDEX idx_template_schemas_category ON public.template_schemas(category);
CREATE INDEX idx_template_schemas_active ON public.template_schemas(is_active);
CREATE INDEX idx_company_customizations_company ON public.company_template_customizations(company_id);
CREATE INDEX idx_company_customizations_template ON public.company_template_customizations(template_schema_id);
CREATE INDEX idx_upload_history_company ON public.upload_history(company_id);
CREATE INDEX idx_upload_history_user ON public.upload_history(user_id);
CREATE INDEX idx_upload_history_template ON public.upload_history(template_schema_id);
CREATE INDEX idx_upload_history_status ON public.upload_history(upload_status);
CREATE INDEX idx_template_versions_schema ON public.template_versions(template_schema_id);
CREATE INDEX idx_template_versions_published ON public.template_versions(is_published);