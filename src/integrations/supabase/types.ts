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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in_location: Json | null
          clock_in_photo_url: string | null
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string
          date: string
          eod_submitted: boolean | null
          id: string
          is_late: boolean | null
          late_minutes: number | null
          notes: string | null
          tod_submitted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in_location?: Json | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date?: string
          eod_submitted?: boolean | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          tod_submitted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in_location?: Json | null
          clock_in_photo_url?: string | null
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string
          date?: string
          eod_submitted?: boolean | null
          id?: string
          is_late?: boolean | null
          late_minutes?: number | null
          notes?: string | null
          tod_submitted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extra_work: {
        Row: {
          admin_comments: string | null
          approved_by: string | null
          attendance_id: string | null
          compensation_amount: number | null
          created_at: string
          hours: number
          id: string
          notes: string | null
          processed_at: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["extra_work_status"] | null
          task_description: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          admin_comments?: string | null
          approved_by?: string | null
          attendance_id?: string | null
          compensation_amount?: number | null
          created_at?: string
          hours: number
          id?: string
          notes?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["extra_work_status"] | null
          task_description: string
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          admin_comments?: string | null
          approved_by?: string | null
          attendance_id?: string | null
          compensation_amount?: number | null
          created_at?: string
          hours?: number
          id?: string
          notes?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["extra_work_status"] | null
          task_description?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_work_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          admin_comments: string | null
          approved_by: string | null
          created_at: string
          delegation_notes: string
          end_date: string
          half_day_period: string | null
          has_advance_notice: boolean | null
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          penalty_amount: number | null
          processed_at: string | null
          reason: string | null
          requested_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_comments?: string | null
          approved_by?: string | null
          created_at?: string
          delegation_notes: string
          end_date: string
          half_day_period?: string | null
          has_advance_notice?: boolean | null
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          penalty_amount?: number | null
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_comments?: string | null
          approved_by?: string | null
          created_at?: string
          delegation_notes?: string
          end_date?: string
          half_day_period?: string | null
          has_advance_notice?: boolean | null
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          penalty_amount?: number | null
          processed_at?: string | null
          reason?: string | null
          requested_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          mobile: string | null
          monthly_salary: number | null
          updated_at: string
          user_id: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          mobile?: string | null
          monthly_salary?: number | null
          updated_at?: string
          user_id: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          mobile?: string | null
          monthly_salary?: number | null
          updated_at?: string
          user_id?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      rules_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean | null
          rule_key: string
          rule_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          rule_key: string
          rule_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          rule_key?: string
          rule_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          base_salary: number
          breakdown: Json | null
          created_at: string
          eod_penalties: number | null
          extra_work_additions: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          is_finalized: boolean | null
          late_deductions: number | null
          leave_deductions: number | null
          leave_penalties: number | null
          net_salary: number
          other_additions: number | null
          other_deductions: number | null
          period_end: string
          period_start: string
          tod_penalties: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary: number
          breakdown?: Json | null
          created_at?: string
          eod_penalties?: number | null
          extra_work_additions?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_finalized?: boolean | null
          late_deductions?: number | null
          leave_deductions?: number | null
          leave_penalties?: number | null
          net_salary: number
          other_additions?: number | null
          other_deductions?: number | null
          period_end: string
          period_start: string
          tod_penalties?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          breakdown?: Json | null
          created_at?: string
          eod_penalties?: number | null
          extra_work_additions?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_finalized?: boolean | null
          late_deductions?: number | null
          leave_deductions?: number | null
          leave_penalties?: number | null
          net_salary?: number
          other_additions?: number | null
          other_deductions?: number | null
          period_end?: string
          period_start?: string
          tod_penalties?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      salary_settings: {
        Row: {
          created_at: string
          custom_end_day: number | null
          custom_start_day: number | null
          cycle_type: Database["public"]["Enums"]["salary_cycle_type"] | null
          id: string
          updated_at: string
          updated_by: string | null
          working_days_per_month: number | null
        }
        Insert: {
          created_at?: string
          custom_end_day?: number | null
          custom_start_day?: number | null
          cycle_type?: Database["public"]["Enums"]["salary_cycle_type"] | null
          id?: string
          updated_at?: string
          updated_by?: string | null
          working_days_per_month?: number | null
        }
        Update: {
          created_at?: string
          custom_end_day?: number | null
          custom_start_day?: number | null
          cycle_type?: Database["public"]["Enums"]["salary_cycle_type"] | null
          id?: string
          updated_at?: string
          updated_by?: string | null
          working_days_per_month?: number | null
        }
        Relationships: []
      }
      shoot_assignments: {
        Row: {
          created_at: string
          id: string
          shoot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shoot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shoot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shoot_assignments_shoot_id_fkey"
            columns: ["shoot_id"]
            isOneToOne: false
            referencedRelation: "shoots"
            referencedColumns: ["id"]
          },
        ]
      }
      shoots: {
        Row: {
          brand_name: string
          brief: string | null
          created_at: string
          created_by: string | null
          event_name: string
          id: string
          location: string
          location_coordinates: Json | null
          notes: string | null
          shoot_date: string
          shoot_time: string
          status: Database["public"]["Enums"]["shoot_status"] | null
          updated_at: string
        }
        Insert: {
          brand_name: string
          brief?: string | null
          created_at?: string
          created_by?: string | null
          event_name: string
          id?: string
          location: string
          location_coordinates?: Json | null
          notes?: string | null
          shoot_date: string
          shoot_time: string
          status?: Database["public"]["Enums"]["shoot_status"] | null
          updated_at?: string
        }
        Update: {
          brand_name?: string
          brief?: string | null
          created_at?: string
          created_by?: string | null
          event_name?: string
          id?: string
          location?: string
          location_coordinates?: Json | null
          notes?: string | null
          shoot_date?: string
          shoot_time?: string
          status?: Database["public"]["Enums"]["shoot_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          attendance_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_edited: boolean | null
          pending_reason: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          submitted_at: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_edited?: boolean | null
          pending_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_edited?: boolean | null
          pending_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
      extra_work_status: "pending" | "approved" | "rejected"
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "half_day" | "full_day" | "multiple_days"
      notification_type:
        | "leave_request"
        | "extra_work_request"
        | "request_approved"
        | "request_rejected"
        | "shoot_reminder"
        | "missing_tod"
        | "missing_eod"
        | "salary_generated"
      salary_cycle_type: "monthly" | "bi_weekly" | "custom"
      shoot_status: "pending" | "in_progress" | "completed"
      task_status: "pending" | "completed"
      task_type: "tod" | "urgent_tod"
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
      app_role: ["admin", "employee"],
      extra_work_status: ["pending", "approved", "rejected"],
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["half_day", "full_day", "multiple_days"],
      notification_type: [
        "leave_request",
        "extra_work_request",
        "request_approved",
        "request_rejected",
        "shoot_reminder",
        "missing_tod",
        "missing_eod",
        "salary_generated",
      ],
      salary_cycle_type: ["monthly", "bi_weekly", "custom"],
      shoot_status: ["pending", "in_progress", "completed"],
      task_status: ["pending", "completed"],
      task_type: ["tod", "urgent_tod"],
    },
  },
} as const
