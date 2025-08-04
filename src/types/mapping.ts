export interface FieldMappingResult {
  canonical: string;
  detected: string;
  confidence_score: number;
  source: 'exact' | 'synonym' | 'fuzzy';
  required: boolean;
}

export interface ParsedCSVResult {
  success: boolean;
  needs_review: boolean;
  confidence_score: number;
  reqId: string;
  mapped_fields: Record<string, FieldMappingResult>;
  unmapped_columns: string[];
  mapping_profile_used?: string;
  company_data?: CompanyData;
  shareholder_data?: ShareholderData[];
  stats: {
    total_columns: number;
    mapped_columns: number;
    required_mapped: number;
    confidence_avg: number;
  };
  errors?: string[];
  code?: string;
  message?: string;
  missing_fields?: string[];
}

export interface MappingProfile {
  id: string;
  org_id: string;
  profile_name: string;
  field_mappings: Record<string, string>;
  confidence_threshold: number;
}

export interface CompanyData {
  company_name: string;
  sector: string;
  industry?: string;
  founded_year?: number;
  employees_range?: string;
  annual_revenue_range?: string;
  hq_city?: string;
  hq_country?: string;
  website?: string;
  business_description?: string;
  currency_code?: string;
  accounting_standard?: string;
  consolidation?: string;
  cif?: string;
}

export interface ShareholderData {
  shareholder_name: string;
  shareholder_type?: string;
  country?: string;
  ownership_pct?: number;
  notes?: string;
}

export interface FieldSynonym {
  canonical: string;
  synonyms_es: string[];
  synonyms_en: string[];
  required: boolean;
  category: 'company_info' | 'shareholder_info';
}

export interface MappingReviewProps {
  isOpen: boolean;
  onClose: () => void;
  mappingResult: ParsedCSVResult;
  onConfirm: (adjustedMapping: Record<string, string>, profileName?: string) => void;
}