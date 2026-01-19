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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          day: string
          description: string | null
          end_time: string | null
          id: string
          is_visible: boolean
          links: Json | null
          start_time: string | null
          time: string
          title: string
          type: string
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          day: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_visible?: boolean
          links?: Json | null
          start_time?: string | null
          time: string
          title: string
          type: string
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          day?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_visible?: boolean
          links?: Json | null
          start_time?: string | null
          time?: string
          title?: string
          type?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_visible: boolean
          language: string | null
          order_index: number
          question: string
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          language?: string | null
          order_index?: number
          question: string
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          language?: string | null
          order_index?: number
          question?: string
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      ticket_settings: {
        Row: {
          id: string
          early_bird_enabled: boolean
          early_bird_cutoff: string | null
          early_bird_total_limit: number | null
          normal_total_limit: number | null
          bar_limit: number | null
          kuechenhilfe_limit: number | null
          springer_runner_limit: number | null
          springer_toilet_limit: number | null
          abbau_limit: number | null
          aufbau_limit: number | null
          awareness_limit: number | null
          schichtleitung_limit: number | null
          tech_limit: number | null
          bar_price_early: number | null
          bar_price_normal: number | null
          kuechenhilfe_price_early: number | null
          kuechenhilfe_price_normal: number | null
          springer_runner_price_early: number | null
          springer_runner_price_normal: number | null
          springer_toilet_price_early: number | null
          springer_toilet_price_normal: number | null
          abbau_price_early: number | null
          abbau_price_normal: number | null
          aufbau_price_early: number | null
          aufbau_price_normal: number | null
          awareness_price_early: number | null
          awareness_price_normal: number | null
          schichtleitung_price_early: number | null
          schichtleitung_price_normal: number | null
          tech_price_early: number | null
          tech_price_normal: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          early_bird_enabled?: boolean
          early_bird_cutoff?: string | null
          early_bird_total_limit?: number | null
          normal_total_limit?: number | null
          bar_limit?: number | null
          kuechenhilfe_limit?: number | null
          springer_runner_limit?: number | null
          springer_toilet_limit?: number | null
          abbau_limit?: number | null
          aufbau_limit?: number | null
          awareness_limit?: number | null
          schichtleitung_limit?: number | null
          tech_limit?: number | null
          bar_price_early?: number | null
          bar_price_normal?: number | null
          kuechenhilfe_price_early?: number | null
          kuechenhilfe_price_normal?: number | null
          springer_runner_price_early?: number | null
          springer_runner_price_normal?: number | null
          springer_toilet_price_early?: number | null
          springer_toilet_price_normal?: number | null
          abbau_price_early?: number | null
          abbau_price_normal?: number | null
          aufbau_price_early?: number | null
          aufbau_price_normal?: number | null
          awareness_price_early?: number | null
          awareness_price_normal?: number | null
          schichtleitung_price_early?: number | null
          schichtleitung_price_normal?: number | null
          tech_price_early?: number | null
          tech_price_normal?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          early_bird_enabled?: boolean
          early_bird_cutoff?: string | null
          early_bird_total_limit?: number | null
          normal_total_limit?: number | null
          bar_limit?: number | null
          kuechenhilfe_limit?: number | null
          springer_runner_limit?: number | null
          springer_toilet_limit?: number | null
          abbau_limit?: number | null
          aufbau_limit?: number | null
          awareness_limit?: number | null
          schichtleitung_limit?: number | null
          tech_limit?: number | null
          bar_price_early?: number | null
          bar_price_normal?: number | null
          kuechenhilfe_price_early?: number | null
          kuechenhilfe_price_normal?: number | null
          springer_runner_price_early?: number | null
          springer_runner_price_normal?: number | null
          springer_toilet_price_early?: number | null
          springer_toilet_price_normal?: number | null
          abbau_price_early?: number | null
          abbau_price_normal?: number | null
          aufbau_price_early?: number | null
          aufbau_price_normal?: number | null
          awareness_price_early?: number | null
          awareness_price_normal?: number | null
          schichtleitung_price_early?: number | null
          schichtleitung_price_normal?: number | null
          tech_price_early?: number | null
          tech_price_normal?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_purchases: {
        Row: {
          id: string
          user_id: string | null
          ticket_type: string
          role: string
          price: number
          purchaser_name: string
          purchaser_email: string
          status: string
          payment_reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          ticket_type: string
          role: string
          price: number
          purchaser_name: string
          purchaser_email: string
          status?: string
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          ticket_type?: string
          role?: string
          price?: number
          purchaser_name?: string
          purchaser_email?: string
          status?: string
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
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
