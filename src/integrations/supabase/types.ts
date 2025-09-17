export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          companies_house_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          companies_house_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          companies_house_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          created_at: string
          id: string
          meter_type: string
          mic: number | null
          mpan_full: string | null
          mpan_top_line: string | null
          mprn: string | null
          site_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meter_type: string
          mic?: number | null
          mpan_full?: string | null
          mpan_top_line?: string | null
          mprn?: string | null
          site_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meter_type?: string
          mic?: number | null
          mpan_full?: string | null
          mpan_top_line?: string | null
          mprn?: string | null
          site_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      optimiser_runs: {
        Row: {
          battery_cost_per_kwh: number
          created_at: string
          cycle_eff_pct: number
          id: string
          logs: Json | null
          max_thresh_pct: number
          mic: number
          min_thresh_pct: number
          mpan: string
          parsed_report: Json | null
          process_guid: string | null
          result_csv: string | null
          site_id: string
          solar_cost_per_kw: number
          status: string
          updated_at: string
        }
        Insert: {
          battery_cost_per_kwh: number
          created_at?: string
          cycle_eff_pct: number
          id?: string
          logs?: Json | null
          max_thresh_pct: number
          mic: number
          min_thresh_pct: number
          mpan: string
          parsed_report?: Json | null
          process_guid?: string | null
          result_csv?: string | null
          site_id: string
          solar_cost_per_kw: number
          status?: string
          updated_at?: string
        }
        Update: {
          battery_cost_per_kwh?: number
          created_at?: string
          cycle_eff_pct?: number
          id?: string
          logs?: Json | null
          max_thresh_pct?: number
          mic?: number
          min_thresh_pct?: number
          mpan?: string
          parsed_report?: Json | null
          process_guid?: string | null
          result_csv?: string | null
          site_id?: string
          solar_cost_per_kw?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimiser_runs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          area_m2: number | null
          city: string | null
          company_id: string
          contact_id: string | null
          cooking_pct: number | null
          created_at: string
          elec_supplier: string | null
          elec_unit_rate_pence: number | null
          floors: number | null
          gas_supplier: string | null
          gas_unit_rate_pence: number | null
          heating_pct: number | null
          hot_water_pct: number | null
          id: string
          lighting_pct: number | null
          listed_grade: string | null
          loa_file_url: string | null
          loa_status: string
          others_pct: number | null
          postcode: string | null
          updated_at: string
          uprn: string | null
          year_built: number | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          area_m2?: number | null
          city?: string | null
          company_id: string
          contact_id?: string | null
          cooking_pct?: number | null
          created_at?: string
          elec_supplier?: string | null
          elec_unit_rate_pence?: number | null
          floors?: number | null
          gas_supplier?: string | null
          gas_unit_rate_pence?: number | null
          heating_pct?: number | null
          hot_water_pct?: number | null
          id?: string
          lighting_pct?: number | null
          listed_grade?: string | null
          loa_file_url?: string | null
          loa_status?: string
          others_pct?: number | null
          postcode?: string | null
          updated_at?: string
          uprn?: string | null
          year_built?: number | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          area_m2?: number | null
          city?: string | null
          company_id?: string
          contact_id?: string | null
          cooking_pct?: number | null
          created_at?: string
          elec_supplier?: string | null
          elec_unit_rate_pence?: number | null
          floors?: number | null
          gas_supplier?: string | null
          gas_unit_rate_pence?: number | null
          heating_pct?: number | null
          hot_water_pct?: number | null
          id?: string
          lighting_pct?: number | null
          listed_grade?: string | null
          loa_file_url?: string | null
          loa_status?: string
          others_pct?: number | null
          postcode?: string | null
          updated_at?: string
          uprn?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
