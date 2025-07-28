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
      client_configurations: {
        Row: {
          client_name: string
          created_at: string
          data_patterns: Json | null
          default_units: string | null
          field_mappings: Json | null
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
          default_units?: string | null
          field_mappings?: Json | null
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
          default_units?: string | null
          field_mappings?: Json | null
          id?: string
          industry_sector?: string | null
          updated_at?: string
          user_id?: string
          validation_rules?: Json | null
        }
        Relationships: []
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
      financial_data: {
        Row: {
          created_at: string
          data_content: Json
          data_type: string
          excel_file_id: string | null
          id: string
          period_date: string
          period_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_content: Json
          data_type: string
          excel_file_id?: string | null
          id?: string
          period_date: string
          period_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_content?: Json
          data_type?: string
          excel_file_id?: string | null
          id?: string
          period_date?: string
          period_type?: string
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
      user_profiles: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
