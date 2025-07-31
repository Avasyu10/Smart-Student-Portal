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
      assignments: {
        Row: {
          course_name: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          file_types_allowed: string[] | null
          id: string
          instructions: string | null
          max_file_size_mb: number | null
          max_points: number | null
          rubric_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_name: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          file_types_allowed?: string[] | null
          id?: string
          instructions?: string | null
          max_file_size_mb?: number | null
          max_points?: number | null
          rubric_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_name?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          file_types_allowed?: string[] | null
          id?: string
          instructions?: string | null
          max_file_size_mb?: number | null
          max_points?: number | null
          rubric_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assignments_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      criteria_grades: {
        Row: {
          ai_comment: string | null
          ai_score: number | null
          created_at: string
          criteria_id: string
          id: string
          submission_grade_id: string
          teacher_comment: string | null
          teacher_score: number | null
        }
        Insert: {
          ai_comment?: string | null
          ai_score?: number | null
          created_at?: string
          criteria_id: string
          id?: string
          submission_grade_id: string
          teacher_comment?: string | null
          teacher_score?: number | null
        }
        Update: {
          ai_comment?: string | null
          ai_score?: number | null
          created_at?: string
          criteria_id?: string
          id?: string
          submission_grade_id?: string
          teacher_comment?: string | null
          teacher_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "criteria_grades_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criteria_grades_submission_grade_id_fkey"
            columns: ["submission_grade_id"]
            isOneToOne: false
            referencedRelation: "submission_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          assignment_id: string | null
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          submission_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          submission_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          submission_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          location?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rubric_criteria: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_points: number
          name: string
          order_index: number
          rubric_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_points: number
          name: string
          order_index?: number
          rubric_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_points?: number
          name?: string
          order_index?: number
          rubric_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      student_feedback_analysis: {
        Row: {
          analyzed_at: string
          created_at: string
          feedback_count: number
          id: string
          sentiment_analysis: Json
          student_id: string
          updated_at: string
        }
        Insert: {
          analyzed_at?: string
          created_at?: string
          feedback_count?: number
          id?: string
          sentiment_analysis: Json
          student_id: string
          updated_at?: string
        }
        Update: {
          analyzed_at?: string
          created_at?: string
          feedback_count?: number
          id?: string
          sentiment_analysis?: Json
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_teachers: {
        Row: {
          created_at: string
          enrolled_at: string
          id: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_grades: {
        Row: {
          ai_feedback: string | null
          ai_grade: number | null
          ai_review: string | null
          content_score: number | null
          created_at: string
          creativity_score: number | null
          graded_at: string | null
          graded_by: string | null
          grammar_score: number | null
          id: string
          improvements: string[] | null
          overall_score: number | null
          rubric_id: string | null
          strengths: string[] | null
          structure_score: number | null
          submission_id: string
          teacher_feedback: string | null
          teacher_grade: number | null
          teacher_review: string | null
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_grade?: number | null
          ai_review?: string | null
          content_score?: number | null
          created_at?: string
          creativity_score?: number | null
          graded_at?: string | null
          graded_by?: string | null
          grammar_score?: number | null
          id?: string
          improvements?: string[] | null
          overall_score?: number | null
          rubric_id?: string | null
          strengths?: string[] | null
          structure_score?: number | null
          submission_id: string
          teacher_feedback?: string | null
          teacher_grade?: number | null
          teacher_review?: string | null
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          ai_grade?: number | null
          ai_review?: string | null
          content_score?: number | null
          created_at?: string
          creativity_score?: number | null
          graded_at?: string | null
          graded_by?: string | null
          grammar_score?: number | null
          id?: string
          improvements?: string[] | null
          overall_score?: number | null
          rubric_id?: string | null
          strengths?: string[] | null
          structure_score?: number | null
          submission_id?: string
          teacher_feedback?: string | null
          teacher_grade?: number | null
          teacher_review?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_grades_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_grades_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          file_name: string | null
          file_size_mb: number | null
          file_url: string | null
          grade: number | null
          id: string
          plagiarism_report: Json | null
          plagiarism_score: number | null
          status: string | null
          student_id: string
          submitted_at: string | null
          teacher_comments: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          file_size_mb?: number | null
          file_url?: string | null
          grade?: number | null
          id?: string
          plagiarism_report?: Json | null
          plagiarism_score?: number | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
          teacher_comments?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          file_size_mb?: number | null
          file_url?: string | null
          grade?: number | null
          id?: string
          plagiarism_report?: Json | null
          plagiarism_score?: number | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          teacher_comments?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: string
      }
    }
    Enums: {
      user_role: "teacher" | "student"
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
      user_role: ["teacher", "student"],
    },
  },
} as const
