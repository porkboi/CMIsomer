export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      registrations: {
        Row: {
          id: number
          name: string
          andrewID: string
          age: number
          organization: string
          paymentMethod: string
          paymentConfirmed: string
          status: string
          createdAt: string
          price?: number
          qrCode?: string
        }
        Insert: {
          id?: number
          name: string
          andrewID: string
          age: number
          organization: string
          paymentMethod: string
          paymentConfirmed: string
          status: string
          createdAt?: string
          price?: number
          qrCode?: string
        }
        Update: {
          id?: number
          name?: string
          andrewID?: string
          age?: number
          organization?: string
          paymentMethod?: string
          paymentConfirmed?: string
          status?: string
          createdAt?: string
          price?: number
          qrCode?: string
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

