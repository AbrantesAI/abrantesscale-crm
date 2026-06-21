export type Database = {
  public: {
    Tables: {
      pipeline_stages: {
        Row: {
          id: string
          owner_id: string
          name: string
          position: number
          track: string
          win_prob: number | null
          is_won: boolean
          is_lost: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          position: number
          track?: string
          win_prob?: number | null
          is_won?: boolean
          is_lost?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          position?: number
          track?: string
          win_prob?: number | null
          is_won?: boolean
          is_lost?: boolean
          created_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          full_name: string
          instagram: string | null
          email: string | null
          phone: string | null
          company: string | null
          website: string | null
          source: string | null
          stage_id: string | null
          deal_value: number | null
          status: string
          notes: string | null
          ai_score: number | null
          ai_summary: string | null
          lead_type: string
          funnel_destination: string | null
          community_status: string
          outreach_status: string | null
          content_pillar: string | null
          stage_changed_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          full_name: string
          instagram?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          website?: string | null
          source?: string | null
          stage_id?: string | null
          deal_value?: number | null
          status?: string
          notes?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          lead_type?: string
          funnel_destination?: string | null
          community_status?: string
          outreach_status?: string | null
          content_pillar?: string | null
          stage_changed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          full_name?: string
          instagram?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          website?: string | null
          source?: string | null
          stage_id?: string | null
          deal_value?: number | null
          status?: string
          notes?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          lead_type?: string
          funnel_destination?: string | null
          community_status?: string
          outreach_status?: string | null
          content_pillar?: string | null
          stage_changed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          owner_id: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          color?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          color?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: string
          owner_id: string
          contact_id: string
          type: string
          content: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          contact_id: string
          type: string
          content?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          contact_id?: string
          type?: string
          content?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          owner_id: string
          contact_id: string | null
          title: string
          due_date: string | null
          is_done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          contact_id?: string | null
          title: string
          due_date?: string | null
          is_done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          contact_id?: string | null
          title?: string
          due_date?: string | null
          is_done?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      discovery_notes: {
        Row: {
          id: string
          owner_id: string
          contact_id: string
          business_desc: string | null
          pain_points: string | null
          ai_opportunity: string | null
          budget: string | null
          raw_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          contact_id: string
          business_desc?: string | null
          pain_points?: string | null
          ai_opportunity?: string | null
          budget?: string | null
          raw_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          contact_id?: string
          business_desc?: string | null
          pain_points?: string | null
          ai_opportunity?: string | null
          budget?: string | null
          raw_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      stage_transitions: {
        Row: {
          id: string
          owner_id: string
          contact_id: string
          from_stage: string | null
          to_stage: string | null
          track: string | null
          changed_at: string
          days_in_prev: number | null
        }
        Insert: {
          id?: string
          owner_id: string
          contact_id: string
          from_stage?: string | null
          to_stage?: string | null
          track?: string | null
          changed_at?: string
          days_in_prev?: number | null
        }
        Update: {
          id?: string
          owner_id?: string
          contact_id?: string
          from_stage?: string | null
          to_stage?: string | null
          track?: string | null
          changed_at?: string
          days_in_prev?: number | null
        }
        Relationships: []
      }
      daily_snapshots: {
        Row: {
          id: string
          owner_id: string
          snapshot_date: string
          total_leads: number
          active_leads: number
          pipeline_value: number
          mrr: number
          ztl_members: number
          flc_members: number
        }
        Insert: {
          id?: string
          owner_id: string
          snapshot_date?: string
          total_leads?: number
          active_leads?: number
          pipeline_value?: number
          mrr?: number
          ztl_members?: number
          flc_members?: number
        }
        Update: {
          id?: string
          owner_id?: string
          snapshot_date?: string
          total_leads?: number
          active_leads?: number
          pipeline_value?: number
          mrr?: number
          ztl_members?: number
          flc_members?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          owner_id: string
          metric: string
          label: string | null
          target: number
          current_val: number
          period: string | null
          period_start: string | null
          period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          metric: string
          label?: string | null
          target: number
          current_val?: number
          period?: string | null
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          metric?: string
          label?: string | null
          target?: number
          current_val?: number
          period?: string | null
          period_start?: string | null
          period_end?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lost_reasons: {
        Row: {
          id: string
          owner_id: string
          label: string
        }
        Insert: {
          id?: string
          owner_id: string
          label: string
        }
        Update: {
          id?: string
          owner_id?: string
          label?: string
        }
        Relationships: []
      }
      content_pieces: {
        Row: {
          id: string
          owner_id: string
          platform: string | null
          format: string | null
          pillar: string | null
          title: string
          hook: string | null
          result_base: string | null
          url: string | null
          status: string
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          platform?: string | null
          format?: string | null
          pillar?: string | null
          title: string
          hook?: string | null
          result_base?: string | null
          url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          platform?: string | null
          format?: string | null
          pillar?: string | null
          title?: string
          hook?: string | null
          result_base?: string | null
          url?: string | null
          status?: string
          published_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      icp_definition: {
        Row: {
          id: string
          owner_id: string
          sector: string | null
          main_pain: string | null
          ticket: string | null
          qual_signals: string | null
          red_flags: string | null
          approach: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          sector?: string | null
          main_pain?: string | null
          ticket?: string | null
          qual_signals?: string | null
          red_flags?: string | null
          approach?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          sector?: string | null
          main_pain?: string | null
          ticket?: string | null
          qual_signals?: string | null
          red_flags?: string | null
          approach?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Tipos de conveniência
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Aliases úteis
export type PipelineStage = Tables<'pipeline_stages'>
export type Contact = Tables<'contacts'>
export type Tag = Tables<'tags'>
export type Activity = Tables<'activities'>
export type Task = Tables<'tasks'>
export type DiscoveryNote = Tables<'discovery_notes'>
export type Goal = Tables<'goals'>
export type StageTransition = Tables<'stage_transitions'>
export type DailySnapshot = Tables<'daily_snapshots'>
export type ContentPiece = Tables<'content_pieces'>
export type IcpDefinition = Tables<'icp_definition'>

// Valores válidos para campos enum-like
export type LeadType = 'pme' | 'creator' | 'unknown'
export type OutreachStatus = 'a_contactar' | 'ligado' | 'reuniao_marcada' | 'qualificado' | 'sem_interesse'
export type ContentStatus = 'ideia' | 'rascunho' | 'publicado'
export type ContentFormat = 'reel' | 'story' | 'post' | 'carrossel' | 'email'
export type ContentPlatform = 'instagram' | 'skool' | 'newsletter' | 'linkedin'
export type FunnelDestination = 'scalit' | 'zero_to_leverage' | 'full_leverage_circle' | 'mentoria_1a1'
export type CommunityStatus = 'none' | 'zero_to_leverage' | 'full_leverage_circle'
export type ContentPillar = 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'
export type ContactSource = 'reels' | 'stories' | 'dm' | 'comment' | 'bio_link' | 'referral' | 'other'
export type ActivityType = 'note' | 'dm' | 'call' | 'email' | 'follow_up' | 'stage_change'
export type PipelineTrack = 'sales' | 'community'
