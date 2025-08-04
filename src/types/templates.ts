// Types for the dynamic template system

export type TemplateCategory = 'financial' | 'operational' | 'qualitative';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url';

export type ValidationType = 'range' | 'format' | 'required' | 'calculation' | 'custom';

export interface ColumnValidation {
  type: ValidationType;
  min?: number;
  max?: number;
  pattern?: string;
  rule?: string;
  message?: string;
  tolerance?: number;
}

export interface TemplateColumn {
  name: string;
  type: ColumnType;
  required: boolean;
  description?: string;
  validations?: ColumnValidation[];
  defaultValue?: any;
  options?: string[]; // For select/enum type columns
}

export interface ValidationRule {
  type: 'required_fields' | 'balance_check' | 'calculation' | 'format' | 'calculation_check' | 'custom';
  fields?: string[];
  field?: string;
  description?: string;
  rule?: string;
  formula?: string;
  target_field?: string;
  tolerance?: number;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

export interface TemplateSchemaDefinition {
  columns: TemplateColumn[];
  variableYearColumns?: boolean;
  yearColumnPattern?: string;
  expectedConcepts?: string[];
  allowAdditionalColumns?: boolean;
  delimiter?: string;
  encoding?: string;
}

export interface TemplateSchema {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: TemplateCategory;
  version: number;
  is_active: boolean;
  is_required: boolean;
  schema_definition: TemplateSchemaDefinition;
  validation_rules: ValidationRule[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyTemplateCustomization {
  id: string;
  company_id: string;
  template_schema_id: string;
  custom_schema?: Partial<TemplateSchemaDefinition>;
  custom_validations?: ValidationRule[];
  custom_display_name?: string;
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  delimiter: string;
  encoding: string;
  headers: string[];
  row_count: number;
  column_count: number;
  file_size: number;
  mime_type?: string;
}

export interface ValidationError {
  row?: number;
  column?: string;
  value?: any;
  message: string;
  type: ValidationType;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationStatistics {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  warnings_count: number;
  errors_count: number;
  duplicates_count?: number;
  empty_rows_count?: number;
}

export interface ValidationResults {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  statistics: ValidationStatistics;
  summary?: string;
}

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'validating';

export interface UploadHistory {
  id: string;
  company_id?: string;
  user_id?: string;
  template_schema_id?: string;
  template_name: string;
  original_filename: string;
  file_size?: number;
  file_hash?: string;
  upload_status: UploadStatus;
  processing_job_id?: string;
  detected_years?: number[];
  selected_years?: number[];
  validation_results?: ValidationResults;
  file_metadata?: FileMetadata;
  uploaded_at: string;
  processed_at?: string;
  completed_at?: string;
}

export interface TemplateVersion {
  id: string;
  template_schema_id: string;
  version_number: number;
  schema_definition: TemplateSchemaDefinition;
  validation_rules: ValidationRule[];
  change_summary?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
}

// Template generation and processing types
export interface GenerateTemplateRequest {
  template_name: string;
  company_id?: string;
  years?: number[];
  customizations?: Partial<TemplateSchemaDefinition>;
  format?: 'csv' | 'xlsx';
  delimiter?: string;
}

export interface GenerateTemplateResponse {
  success: boolean;
  template_url?: string;
  template_content?: string;
  filename: string;
  error?: string;
}

export interface ProcessFileRequest {
  file: File;
  template_name?: string;
  company_id?: string;
  selected_years?: number[];
  dry_run?: boolean;
  custom_validations?: ValidationRule[];
}

export interface ProcessFileResponse {
  success: boolean;
  job_id?: string;
  upload_id?: string;
  validation_results?: ValidationResults;
  detected_years?: number[];
  preview_data?: any[];
  error?: string;
}

// File preview and analysis types
export interface FilePreview {
  headers: string[];
  sample_rows: any[][];
  detected_template?: string;
  detected_years?: number[];
  file_metadata: FileMetadata;
  suggestions?: string[];
  issues?: ValidationError[];
}

export interface TemplateMatch {
  template_name: string;
  confidence: number;
  matched_columns: string[];
  missing_columns: string[];
  extra_columns: string[];
  suggested_mappings?: Record<string, string>;
}

// Enhanced processing types for the new system
export interface EnhancedProcessingStatus {
  job_id: string;
  status: 'PARSING' | 'VALIDATING' | 'LOADING' | 'AGGREGATING' | 'DONE' | 'FAILED';
  progress_pct: number;
  message: string;
  eta_seconds?: number;
  current_step?: string;
  detected_years?: number[];
  selected_years?: number[];
  validation_summary?: ValidationResults;
  per_year?: Record<string, {
    status: string;
    rows_valid: number;
    rows_reject: number;
    progress: number;
  }>;
}

// UI component props types
export interface TemplateManagerProps {
  onTemplateSelect?: (template: TemplateSchema) => void;
  showCustomizations?: boolean;
  companyId?: string;
}

export interface EnhancedUploadProps {
  templateSchema?: TemplateSchema;
  companyId?: string;
  onUploadComplete?: (result: ProcessFileResponse) => void;
  onValidationUpdate?: (results: ValidationResults) => void;
  allowTemplateSelection?: boolean;
}

export interface ValidationSummaryProps {
  validationResults: ValidationResults;
  showDetails?: boolean;
  onErrorClick?: (error: ValidationError) => void;
}

export interface TemplateCustomizerProps {
  templateSchema: TemplateSchema;
  companyId: string;
  onSave?: (customization: CompanyTemplateCustomization) => void;
  existingCustomization?: CompanyTemplateCustomization;
}

// Utility types for template processing
export type TemplateValidationContext = {
  template: TemplateSchema;
  customization?: CompanyTemplateCustomization;
  fileData: any[][];
  headers: string[];
  metadata: FileMetadata;
};

export type ColumnMappingResult = {
  mapped: Record<string, number>; // column name -> file column index
  unmapped: string[]; // template columns not found in file
  extra: string[]; // file columns not in template
  confidence: number;
};

// Export utility type for template service responses
export interface TemplateServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}