export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_mapping: {
        Row: {
          balance_sheet_section: string | null
          created_at: string | null
          income_statement_section: string | null
          level: number | null
          pgc_code: string
          sign: number | null
        }
        Insert: {
          balance_sheet_section?: string | null
          created_at?: string | null
          income_statement_section?: string | null
          level?: number | null
          pgc_code: string
          sign?: number | null
        }
        Update: {
          balance_sheet_section?: string | null
          created_at?: string | null
          income_statement_section?: string | null
          level?: number | null
          pgc_code?: string
          sign?: number | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string | null
          level: number | null
          name: string | null
          parent_code: string | null
          pgc_group: number | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string | null
          level?: number | null
          name?: string | null
          parent_code?: string | null
          pgc_group?: number | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string | null
          level?: number | null
          name?: string | null
          parent_code?: string | null
          pgc_group?: number | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      benchmarks_ratios: {
        Row: {
          company_id: string
          created_at: string
          id: number
          job_id: string | null
          period_year: number
          ratio_category: string
          ratio_name: string
          ratio_value: number | null
          source: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: number
          job_id?: string | null
          period_year: number
          ratio_category: string
          ratio_name: string
          ratio_value?: number | null
          source?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: number
          job_id?: string | null
          period_year?: number
          ratio_category?: string
          ratio_name?: string
          ratio_value?: number | null
          source?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      client_configurations: {
        Row: {
          client_name: string
          created_at: string
          data_patterns: Json | null
          default_physical_unit: string | null
          default_units: string | null
          field_mappings: Json | null
          has_physical_data: boolean | null
          id: string
          industry_sector: string | null
          updated_at: string
          user_id: string
          validation_rules: Json | null
        }
        Insert: {
          client_name: string
          created_at?: string
          data_patterns?: Json | null
          default_physical_unit?: string | null
          default_units?: string | null
          field_mappings?: Json | null
          has_physical_data?: boolean | null
          id?: string
          industry_sector?: string | null
          updated_at?: string
          user_id: string
          validation_rules?: Json | null
        }
        Update: {
          client_name?: string
          created_at?: string
          data_patterns?: Json | null
          default_physical_unit?: string | null
          default_units?: string | null
          field_mappings?: Json | null
          has_physical_data?: boolean | null
          id?: string
          industry_sector?: string | null
          updated_at?: string
          user_id?: string
          validation_rules?: Json | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          accounting_standard: string | null
          created_at: string
          created_by: string | null
          currency_code: string
          id: string
          logo_url: string | null
          name: string
          sector: string | null
          updated_at: string
        }
        Insert: {
          accounting_standard?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          logo_url?: string | null
          name: string
          sector?: string | null
          updated_at?: string
        }
        Update: {
          accounting_standard?: string | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          logo_url?: string | null
          name?: string
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_descriptions: {
        Row: {
          business_model: string | null
          company_name: string
          competitors: string[] | null
          created_at: string
          data_source: string | null
          description: string | null
          employees: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          industry: string | null
          key_facts: string[] | null
          market_position: string | null
          products: string[] | null
          raw_search_result: string | null
          revenue: string | null
          search_query: string | null
          sector: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_model?: string | null
          company_name: string
          competitors?: string[] | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          employees?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_facts?: string[] | null
          market_position?: string | null
          products?: string[] | null
          raw_search_result?: string | null
          revenue?: string | null
          search_query?: string | null
          sector?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_model?: string | null
          company_name?: string
          competitors?: string[] | null
          created_at?: string
          data_source?: string | null
          description?: string | null
          employees?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_facts?: string[] | null
          market_position?: string | null
          products?: string[] | null
          raw_search_result?: string | null
          revenue?: string | null
          search_query?: string | null
          sector?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_info_normalized: {
        Row: {
          company_id: string
          company_name: string
          competitors: Json | null
          created_at: string
          description: string | null
          employees_count: number | null
          founded_year: number | null
          headquarters: string | null
          id: number
          industry: string | null
          job_id: string | null
          key_facts: Json | null
          products: Json | null
          sector: string | null
          uploaded_by: string | null
          website: string | null
        }
        Insert: {
          company_id: string
          company_name: string
          competitors?: Json | null
          created_at?: string
          description?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters?: string | null
          id?: number
          industry?: string | null
          job_id?: string | null
          key_facts?: Json | null
          products?: Json | null
          sector?: string | null
          uploaded_by?: string | null
          website?: string | null
        }
        Update: {
          company_id?: string
          company_name?: string
          competitors?: Json | null
          created_at?: string
          description?: string | null
          employees_count?: number | null
          founded_year?: number | null
          headquarters?: string | null
          id?: number
          industry?: string | null
          job_id?: string | null
          key_facts?: Json | null
          products?: Json | null
          sector?: string | null
          uploaded_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_module_access: {
        Row: {
          company_id: string
          created_at: string
          enabled: boolean
          module_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          enabled?: boolean
          module_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          enabled?: boolean
          module_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile_unified: {
        Row: {
          as_of_date: string
          company_id: string
          confidence: number | null
          created_at: string
          external_id: string | null
          extra_json: Json | null
          field_name: string
          field_value: string | null
          id: number
          job_id: string | null
          notes: string | null
          record_type: string
          source_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          as_of_date: string
          company_id: string
          confidence?: number | null
          created_at?: string
          external_id?: string | null
          extra_json?: Json | null
          field_name: string
          field_value?: string | null
          id?: number
          job_id?: string | null
          notes?: string | null
          record_type: string
          source_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          as_of_date?: string
          company_id?: string
          confidence?: number | null
          created_at?: string
          external_id?: string | null
          extra_json?: Json | null
          field_name?: string
          field_value?: string | null
          id?: number
          job_id?: string | null
          notes?: string | null
          record_type?: string
          source_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      company_shareholder_info: {
        Row: {
          board_of_directors: Json | null
          company_name: string
          created_at: string
          data_source: string | null
          founding_partners: Json | null
          id: string
          key_investors: Json | null
          last_updated_by: string | null
          management_team: Json | null
          shareholder_structure: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          board_of_directors?: Json | null
          company_name: string
          created_at?: string
          data_source?: string | null
          founding_partners?: Json | null
          id?: string
          key_investors?: Json | null
          last_updated_by?: string | null
          management_team?: Json | null
          shareholder_structure?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          board_of_directors?: Json | null
          company_name?: string
          created_at?: string
          data_source?: string | null
          founding_partners?: Json | null
          id?: string
          key_investors?: Json | null
          last_updated_by?: string | null
          management_team?: Json | null
          shareholder_structure?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_template_customizations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          custom_display_name: string | null
          custom_schema: Json | null
          custom_validations: Json | null
          id: string
          is_active: boolean
          template_schema_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          custom_display_name?: string | null
          custom_schema?: Json | null
          custom_validations?: Json | null
          id?: string
          is_active?: boolean
          template_schema_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          custom_display_name?: string | null
          custom_schema?: Json | null
          custom_validations?: Json | null
          id?: string
          is_active?: boolean
          template_schema_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_template_customizations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_template_customizations_template_schema_id_fkey"
            columns: ["template_schema_id"]
            isOneToOne: false
            referencedRelation: "template_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      data_mapping_rules: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          is_active: boolean | null
          rule_name: string
          source_field: string
          target_field: string
          transformation_logic: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_name: string
          source_field: string
          target_field: string
          transformation_logic?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_name?: string
          source_field?: string
          target_field?: string
          transformation_logic?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_quality_logs: {
        Row: {
          confidence_score: number | null
          created_at: string
          file_id: string | null
          id: string
          issues_found: Json | null
          status: string | null
          suggestions: Json | null
          user_id: string
          validation_result: Json
          validation_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          file_id?: string | null
          id?: string
          issues_found?: Json | null
          status?: string | null
          suggestions?: Json | null
          user_id: string
          validation_result: Json
          validation_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          file_id?: string | null
          id?: string
          issues_found?: Json | null
          status?: string | null
          suggestions?: Json | null
          user_id?: string
          validation_result?: Json
          validation_type?: string
        }
        Relationships: []
      }
      debt_balances: {
        Row: {
          company_id: string
          created_at: string
          id: number
          loan_id: number
          year: number
          year_end_balance: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: number
          loan_id: number
          year: number
          year_end_balance?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: number
          loan_id?: number
          year?: number
          year_end_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_balances_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "debt_loans"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_loans: {
        Row: {
          company_id: string
          created_at: string
          currency_code: string
          entity_name: string
          guarantees: string | null
          id: number
          initial_amount: number
          interest_rate: number
          job_id: string | null
          loan_key: string
          loan_type: string
          maturity_date: string
          observations: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          currency_code?: string
          entity_name: string
          guarantees?: string | null
          id?: number
          initial_amount?: number
          interest_rate?: number
          job_id?: string | null
          loan_key: string
          loan_type: string
          maturity_date: string
          observations?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          currency_code?: string
          entity_name?: string
          guarantees?: string | null
          id?: number
          initial_amount?: number
          interest_rate?: number
          job_id?: string | null
          loan_key?: string
          loan_type?: string
          maturity_date?: string
          observations?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      debt_maturities: {
        Row: {
          breakdown_json: Json | null
          company_id: string
          created_at: string
          id: number
          interest_amount: number
          job_id: string | null
          maturity_year: number
          principal_amount: number
          total_amount: number
          uploaded_by: string | null
        }
        Insert: {
          breakdown_json?: Json | null
          company_id: string
          created_at?: string
          id?: number
          interest_amount?: number
          job_id?: string | null
          maturity_year: number
          principal_amount?: number
          total_amount?: number
          uploaded_by?: string | null
        }
        Update: {
          breakdown_json?: Json | null
          company_id?: string
          created_at?: string
          id?: number
          interest_amount?: number
          job_id?: string | null
          maturity_year?: number
          principal_amount?: number
          total_amount?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      detected_periods: {
        Row: {
          confidence_score: number | null
          created_at: string
          file_id: string | null
          id: string
          is_selected: boolean | null
          period_date: string
          period_label: string
          period_type: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          file_id?: string | null
          id?: string
          is_selected?: boolean | null
          period_date: string
          period_label: string
          period_type?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          file_id?: string | null
          id?: string
          is_selected?: boolean | null
          period_date?: string
          period_label?: string
          period_type?: string
          user_id?: string
        }
        Relationships: []
      }
      excel_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          processing_result: Json | null
          processing_status: string | null
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          processing_result?: Json | null
          processing_status?: string | null
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          processing_result?: Json | null
          processing_status?: string | null
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_assumptions: {
        Row: {
          assumption_data: Json
          assumption_type: string
          created_at: string
          id: string
          scenario_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assumption_data: Json
          assumption_type: string
          created_at?: string
          id?: string
          scenario_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assumption_data?: Json
          assumption_type?: string
          created_at?: string
          id?: string
          scenario_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_assumptions_normalized: {
        Row: {
          assumption_category: string
          assumption_name: string
          assumption_value: number
          company_id: string
          created_at: string
          id: number
          job_id: string | null
          notes: string | null
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          unit: string
          uploaded_by: string | null
        }
        Insert: {
          assumption_category: string
          assumption_name: string
          assumption_value?: number
          company_id: string
          created_at?: string
          id?: number
          job_id?: string | null
          notes?: string | null
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          unit?: string
          uploaded_by?: string | null
        }
        Update: {
          assumption_category?: string
          assumption_name?: string
          assumption_value?: number
          company_id?: string
          created_at?: string
          id?: number
          job_id?: string | null
          notes?: string | null
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          unit?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          created_at: string
          data_content: Json
          data_type: string
          excel_file_id: string | null
          id: string
          period_date: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number | null
          physical_units_data: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_content: Json
          data_type: string
          excel_file_id?: string | null
          id?: string
          period_date: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year?: number | null
          physical_units_data?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_content?: Json
          data_type?: string
          excel_file_id?: string | null
          id?: string
          period_date?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number | null
          physical_units_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_excel_file_id_fkey"
            columns: ["excel_file_id"]
            isOneToOne: false
            referencedRelation: "excel_files"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_series_unified: {
        Row: {
          company_id: string
          confidence_score: number | null
          created_at: string
          currency: string
          external_id: string | null
          frequency: string
          id: number
          job_id: string | null
          metric_code: string
          notes: string | null
          period: string
          source: string | null
          unit: string
          uploaded_by: string | null
          value: number
          value_kind: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          created_at?: string
          currency?: string
          external_id?: string | null
          frequency: string
          id?: number
          job_id?: string | null
          metric_code: string
          notes?: string | null
          period: string
          source?: string | null
          unit?: string
          uploaded_by?: string | null
          value?: number
          value_kind?: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          currency?: string
          external_id?: string | null
          frequency?: string
          id?: number
          job_id?: string | null
          metric_code?: string
          notes?: string | null
          period?: string
          source?: string | null
          unit?: string
          uploaded_by?: string | null
          value?: number
          value_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_series_unified_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "metrics_dictionary"
            referencedColumns: ["metric_code"]
          },
        ]
      }
      financial_synonyms: {
        Row: {
          canonical_term: string
          category: string
          confidence_score: number | null
          created_at: string
          id: string
          synonyms: string[]
        }
        Insert: {
          canonical_term: string
          category: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          synonyms: string[]
        }
        Update: {
          canonical_term?: string
          category?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          synonyms?: string[]
        }
        Relationships: []
      }
      fs_balance_lines: {
        Row: {
          amount: number
          company_id: string
          concept: string
          created_at: string
          currency_code: string
          id: number
          job_id: string | null
          period_date: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          section: string
          uploaded_by: string | null
        }
        Insert: {
          amount?: number
          company_id: string
          concept: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          section: string
          uploaded_by?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          concept?: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          section?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      fs_cashflow_lines: {
        Row: {
          amount: number
          category: string
          company_id: string
          concept: string
          created_at: string
          currency_code: string
          id: number
          job_id: string | null
          period_date: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          uploaded_by: string | null
        }
        Insert: {
          amount?: number
          category: string
          company_id: string
          concept: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          uploaded_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          concept?: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      fs_pyg_lines: {
        Row: {
          amount: number
          company_id: string
          concept: string
          created_at: string
          currency_code: string
          id: number
          job_id: string | null
          period_date: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          uploaded_by: string | null
        }
        Insert: {
          amount?: number
          company_id: string
          concept: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          uploaded_by?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          concept?: string
          created_at?: string
          currency_code?: string
          id?: number
          job_id?: string | null
          period_date?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          uploaded_by?: string | null
        }
        Relationships: []
      }
      inflation_rates: {
        Row: {
          created_at: string
          data_type: string
          id: string
          inflation_rate: number
          period_date: string
          region: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_type?: string
          id?: string
          inflation_rate: number
          period_date: string
          region?: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_type?: string
          id?: string
          inflation_rate?: number
          period_date?: string
          region?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string | null
          entry_no: number
          id: number
          memo: string | null
          tx_date: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          entry_no: number
          id?: number
          memo?: string | null
          tx_date: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          entry_no?: number
          id?: number
          memo?: string | null
          tx_date?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account: string
          company_id: string
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          doc_ref: string | null
          entry_id: number
          id: number
          line_hash: string
          line_no: number
        }
        Insert: {
          account: string
          company_id: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          doc_ref?: string | null
          entry_id: number
          id?: number
          line_hash: string
          line_no: number
        }
        Update: {
          account?: string
          company_id?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          doc_ref?: string | null
          entry_id?: number
          id?: number
          line_hash?: string
          line_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      metric_aliases: {
        Row: {
          alias: string
          confidence_score: number | null
          created_at: string
          id: string
          metric_code: string
        }
        Insert: {
          alias: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          metric_code: string
        }
        Update: {
          alias?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          metric_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_aliases_metric_code_fkey"
            columns: ["metric_code"]
            isOneToOne: false
            referencedRelation: "metrics_dictionary"
            referencedColumns: ["metric_code"]
          },
        ]
      }
      metrics_dictionary: {
        Row: {
          category: string
          created_at: string
          default_unit: string
          description: string | null
          id: string
          is_active: boolean
          metric_code: string
          metric_name: string
          value_kind: string
        }
        Insert: {
          category: string
          created_at?: string
          default_unit?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_code: string
          metric_name: string
          value_kind?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_unit?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric_code?: string
          metric_name?: string
          value_kind?: string
        }
        Relationships: []
      }
      operational_metrics: {
        Row: {
          company_id: string
          created_at: string
          id: number
          job_id: string | null
          metric_name: string
          period_date: string
          period_month: number | null
          period_quarter: number | null
          period_type: string
          period_year: number
          segment: string | null
          unit: string
          uploaded_by: string | null
          value: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: number
          job_id?: string | null
          metric_name: string
          period_date: string
          period_month?: number | null
          period_quarter?: number | null
          period_type: string
          period_year: number
          segment?: string | null
          unit?: string
          uploaded_by?: string | null
          value?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: number
          job_id?: string | null
          metric_name?: string
          period_date?: string
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string
          period_year?: number
          segment?: string | null
          unit?: string
          uploaded_by?: string | null
          value?: number
        }
        Relationships: []
      }
      organization_field_mappings: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          created_by: string | null
          field_mappings: Json
          id: string
          org_id: string
          profile_name: string
          updated_at: string
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          org_id: string
          profile_name: string
          updated_at?: string
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          org_id?: string
          profile_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          company_id: string
          created_at: string | null
          dry_run: boolean | null
          error_log_path: string | null
          file_pack_hash: string | null
          file_path: string
          id: string
          import_mode: string | null
          period: unknown | null
          period_month: number | null
          period_quarter: number | null
          period_type: string | null
          period_year: number | null
          stats_json: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          dry_run?: boolean | null
          error_log_path?: string | null
          file_pack_hash?: string | null
          file_path: string
          id?: string
          import_mode?: string | null
          period?: unknown | null
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string | null
          period_year?: number | null
          stats_json?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          dry_run?: boolean | null
          error_log_path?: string | null
          file_pack_hash?: string | null
          file_path?: string
          id?: string
          import_mode?: string | null
          period?: unknown | null
          period_month?: number | null
          period_quarter?: number | null
          period_type?: string | null
          period_year?: number | null
          stats_json?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shareholder_search_history: {
        Row: {
          company_name: string
          id: string
          search_date: string
          search_query: string
          search_results: Json
          status: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          id?: string
          search_date?: string
          search_query: string
          search_results: Json
          status?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          id?: string
          search_date?: string
          search_query?: string
          search_results?: Json
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          modules_access: Json
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          modules_access?: Json
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          modules_access?: Json
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      template_generation_history: {
        Row: {
          company_id: string | null
          file_size: number | null
          generated_at: string
          generated_filename: string
          generation_parameters: Json
          id: string
          template_schema_id: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          file_size?: number | null
          generated_at?: string
          generated_filename: string
          generation_parameters?: Json
          id?: string
          template_schema_id: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          file_size?: number | null
          generated_at?: string
          generated_filename?: string
          generation_parameters?: Json
          id?: string
          template_schema_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_generation_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_generation_history_template_schema_id_fkey"
            columns: ["template_schema_id"]
            isOneToOne: false
            referencedRelation: "template_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      template_schemas: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          schema_definition: Json
          updated_at: string
          validation_rules: Json
          version: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          schema_definition?: Json
          updated_at?: string
          validation_rules?: Json
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          schema_definition?: Json
          updated_at?: string
          validation_rules?: Json
          version?: string
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          analysis_results: Json | null
          analysis_status: string
          completed_at: string | null
          created_at: string
          detected_fields: Json | null
          detected_sheets: Json | null
          eda_results: Json | null
          eda_status: string | null
          file_name: string
          file_size: number | null
          financial_analysis_results: Json | null
          financial_analysis_status: string | null
          id: string
          manual_validations: Json | null
          processing_status: string
          session_name: string
          test_metrics: Json | null
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          analysis_results?: Json | null
          analysis_status?: string
          completed_at?: string | null
          created_at?: string
          detected_fields?: Json | null
          detected_sheets?: Json | null
          eda_results?: Json | null
          eda_status?: string | null
          file_name: string
          file_size?: number | null
          financial_analysis_results?: Json | null
          financial_analysis_status?: string | null
          id?: string
          manual_validations?: Json | null
          processing_status?: string
          session_name: string
          test_metrics?: Json | null
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          analysis_results?: Json | null
          analysis_status?: string
          completed_at?: string | null
          created_at?: string
          detected_fields?: Json | null
          detected_sheets?: Json | null
          eda_results?: Json | null
          eda_status?: string | null
          file_name?: string
          file_size?: number | null
          financial_analysis_results?: Json | null
          financial_analysis_status?: string | null
          id?: string
          manual_validations?: Json | null
          processing_status?: string
          session_name?: string
          test_metrics?: Json | null
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: []
      }
      unit_mappings: {
        Row: {
          base_unit: string
          conversion_factor: number | null
          created_at: string
          id: string
          unit_category: string
          unit_full_name: string
          unit_short_name: string
        }
        Insert: {
          base_unit: string
          conversion_factor?: number | null
          created_at?: string
          id?: string
          unit_category: string
          unit_full_name: string
          unit_short_name: string
        }
        Update: {
          base_unit?: string
          conversion_factor?: number | null
          created_at?: string
          id?: string
          unit_category?: string
          unit_full_name?: string
          unit_short_name?: string
        }
        Relationships: []
      }
      upload_history: {
        Row: {
          company_id: string | null
          created_at: string
          detected_years: number[] | null
          file_metadata: Json | null
          file_size: number | null
          id: string
          original_filename: string
          processing_logs: Json | null
          selected_years: number[] | null
          template_name: string | null
          template_schema_id: string | null
          updated_at: string
          upload_status: string
          user_id: string
          validation_results: Json | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          detected_years?: number[] | null
          file_metadata?: Json | null
          file_size?: number | null
          id?: string
          original_filename: string
          processing_logs?: Json | null
          selected_years?: number[] | null
          template_name?: string | null
          template_schema_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id: string
          validation_results?: Json | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          detected_years?: number[] | null
          file_metadata?: Json | null
          file_size?: number | null
          id?: string
          original_filename?: string
          processing_logs?: Json | null
          selected_years?: number[] | null
          template_name?: string | null
          template_schema_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id?: string
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_history_template_schema_id_fkey"
            columns: ["template_schema_id"]
            isOneToOne: false
            referencedRelation: "template_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_kpis: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          kpi_formula: string | null
          kpi_name: string
          threshold_max: number | null
          threshold_min: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          kpi_formula?: string | null
          kpi_name: string
          threshold_max?: number | null
          threshold_min?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          kpi_formula?: string | null
          kpi_name?: string
          threshold_max?: number | null
          threshold_min?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_period_configurations: {
        Row: {
          comparison_enabled: boolean | null
          comparison_periods: Json | null
          configuration_type: string
          created_at: string
          default_period: string | null
          id: string
          periods_selected: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          comparison_enabled?: boolean | null
          comparison_periods?: Json | null
          configuration_type?: string
          created_at?: string
          default_period?: string | null
          id?: string
          periods_selected?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          comparison_enabled?: boolean | null
          comparison_periods?: Json | null
          configuration_type?: string
          created_at?: string
          default_period?: string | null
          id?: string
          periods_selected?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_logo_url: string | null
          company_name: string | null
          created_at: string
          id: string
          subscription_expires_at: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      fs_ratios_mv: {
        Row: {
          autonomia_financiera: number | null
          calculated_at: string | null
          company_id: string | null
          margen_neto: number | null
          period_month: number | null
          period_quarter: number | null
          period_type: string | null
          period_year: number | null
          prueba_acida: number | null
          ratio_corriente: number | null
          ratio_endeudamiento_financiero: number | null
          ratio_endeudamiento_total: number | null
          ratio_tesoreria: number | null
          roa: number | null
          roe: number | null
          rotacion_activos: number | null
        }
        Relationships: []
      }
      trial_balance_daily_mv: {
        Row: {
          account: string | null
          balance: number | null
          company_id: string | null
          credit_sum: number | null
          debit_sum: number | null
          tx_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_uuid?: string }
        Returns: string
      }
      has_role: {
        Args: {
          user_uuid: string
          check_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      import_journal_lines: {
        Args: { _company: string; _period: unknown; _rows: Json }
        Returns: Json
      }
      is_first_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      promote_user_to_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      refresh_materialized_views: {
        Args: { _company: string }
        Returns: Json
      }
      refresh_ratios_mv: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
