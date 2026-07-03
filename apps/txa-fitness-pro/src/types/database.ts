export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assessments: {
        Row: {
          id: string
          user_id: string
          score: number
          answers: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          answers?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          answers?: Json
          created_at?: string | null
        }
      }
      diagnostic_reports: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          assessment_score: number
          weak_areas: Json
          completion_time_seconds: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          assessment_score: number
          weak_areas?: Json
          completion_time_seconds: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          assessment_id?: string
          assessment_score?: number
          weak_areas?: Json
          completion_time_seconds?: number
          created_at?: string | null
        }
      }
      coaching_plans: {
        Row: {
          id: string
          user_id: string
          assessment_id: string
          status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW'
          goal: string
          summary: string | null
          last_reviewed: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessment_id: string
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW'
          goal: string
          summary?: string | null
          last_reviewed?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          assessment_id?: string
          status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW'
          goal?: string
          summary?: string | null
          last_reviewed?: string | null
          created_at?: string | null
        }
      }
      coaching_modules: {
        Row: {
          id: string
          plan_id: string
          title: string
          description: string
          module_type: 'WISDOM' | 'STRENGTH' | 'CARDIO' | 'SLEEP_HYGIENE' | 'PHYSICAL_ACTIVITY' | 'NUTRITION' | 'RECOVERY' | 'MENTAL_WELLBEING'
          base_difficulty: number
          difficulty_multiplier: number
          created_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          title: string
          description: string
          module_type: 'WISDOM' | 'STRENGTH' | 'CARDIO' | 'SLEEP_HYGIENE' | 'PHYSICAL_ACTIVITY' | 'NUTRITION' | 'RECOVERY' | 'MENTAL_WELLBEING'
          base_difficulty: number
          difficulty_multiplier?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          title?: string
          description?: string
          module_type?: 'WISDOM' | 'STRENGTH' | 'CARDIO' | 'SLEEP_HYGIENE' | 'PHYSICAL_ACTIVITY' | 'NUTRITION' | 'RECOVERY' | 'MENTAL_WELLBEING'
          base_difficulty?: number
          difficulty_multiplier?: number
          created_at?: string | null
        }
      }
      activities: {
        Row: {
          id: string
          module_id: string
          type: 'CALISTHENICS' | 'CARDIO' | 'STRETCH' | 'HABIT_TRACKING'
          title: string
          instructions: string
          expected_metrics: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          module_id: string
          type: 'CALISTHENICS' | 'CARDIO' | 'STRETCH' | 'HABIT_TRACKING'
          title: string
          instructions: string
          expected_metrics?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          module_id?: string
          type?: 'CALISTHENICS' | 'CARDIO' | 'STRETCH' | 'HABIT_TRACKING'
          title?: string
          instructions?: string
          expected_metrics?: Json
          created_at?: string | null
        }
      }
      activity_completion_logs: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          metrics: Json
          completion_status: 'SUCCESS' | 'FAIL' | 'PARTIAL'
          completed_at: string | null
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          metrics?: Json
          completion_status: 'SUCCESS' | 'FAIL' | 'PARTIAL'
          completed_at?: string | null
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          metrics?: Json
          completion_status?: 'SUCCESS' | 'FAIL' | 'PARTIAL'
          completed_at?: string | null
        }
      }
    }
  }
}
