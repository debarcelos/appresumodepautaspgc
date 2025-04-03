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
      processes: {
        Row: {
          id: string
          agendaId: string
          counselorName: string
          processNumber: string
          processType: string
          stakeholders: string
          summary: string
          voteType: string
          mpcOpinionSummary: string
          tceReportSummary: string
          hasViewVote: boolean
          viewVoteSummary: string
          mpcSystemManifest: string
          pgcModifiedManifest: string
          isPgcModified: boolean
          position: number
          additionalNotes: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          agendaId: string
          counselorName: string
          processNumber: string
          processType: string
          stakeholders: string
          summary: string
          voteType: string
          mpcOpinionSummary: string
          tceReportSummary: string
          hasViewVote: boolean
          viewVoteSummary: string
          mpcSystemManifest: string
          pgcModifiedManifest: string
          isPgcModified: boolean
          position: number
          additionalNotes: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agendaId?: string
          counselorName?: string
          processNumber?: string
          processType?: string
          stakeholders?: string
          summary?: string
          voteType?: string
          mpcOpinionSummary?: string
          tceReportSummary?: string
          hasViewVote?: boolean
          viewVoteSummary?: string
          mpcSystemManifest?: string
          pgcModifiedManifest?: string
          isPgcModified?: boolean
          position?: number
          additionalNotes?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
