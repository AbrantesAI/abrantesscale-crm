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

// Valores válidos para campos enum-like
export type LeadType = 'pme' | 'creator' | 'unknown'
export type FunnelDestination = 'scalit' | 'zero_to_leverage' | 'full_leverage_circle' | 'mentoria_1a1'
export type CommunityStatus = 'none' | 'zero_to_leverage' | 'full_leverage_circle'
export type ContentPillar = 'ai_aplicada' | 'tudo_e_vendas' | 'builds_in_public' | 'mindset' | 'other'
export type ContactSource = 'reels' | 'stories' | 'dm' | 'comment' | 'bio_link' | 'referral' | 'other'
export type ActivityType = 'note' | 'dm' | 'call' | 'email' | 'follow_up' | 'stage_change'
export type PipelineTrack = 'sales' | 'community'
