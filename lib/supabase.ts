// lib/supabase.ts

import { createBrowserClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as SupabaseClient<Database>


export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: "user" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: "computers" | "books"
          subcategory: string | null
          image_url: string | null
          stock_quantity: number
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category: "computers" | "books"
          subcategory?: string | null
          image_url?: string | null
          stock_quantity?: number
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category?: "computers" | "books"
          subcategory?: string | null
          image_url?: string | null
          stock_quantity?: number
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
          payment_status: "pending" | "paid" | "failed"
          payment_reference: string | null
          shipping_address: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
          payment_status?: "pending" | "paid" | "failed"
          payment_reference?: string | null
          shipping_address: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
          payment_status?: "pending" | "paid" | "failed"
          payment_reference?: string | null
          shipping_address?: any
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      business_services: {
        Row: {
          id: string
          user_id: string
          service_type: "printing" | "editing" | "analysis" | "other"
          title: string
          description: string
          status: "pending" | "in_progress" | "completed" | "cancelled"
          price: number | null
          files: any[]
          messages: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_type: "printing" | "editing" | "analysis" | "other"
          title: string
          description: string
          status?: "pending" | "in_progress" | "completed" | "cancelled"
          price?: number | null
          files?: any[]
          messages?: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_type?: "printing" | "editing" | "analysis" | "other"
          title?: string
          description?: string
          status?: "pending" | "in_progress" | "completed" | "cancelled"
          price?: number | null
          files?: any[]
          messages?: any[]
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: "info" | "success" | "warning" | "error"
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: "info" | "success" | "warning" | "error"
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: "info" | "success" | "warning" | "error"
          is_read?: boolean
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          rating: number
          message: string | null
          category: "general" | "product" | "service" | "website" | "support"
          status: "pending" | "reviewed" | "resolved"
          admin_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rating: number
          message?: string | null
          category?: "general" | "product" | "service" | "website" | "support"
          status?: "pending" | "reviewed" | "resolved"
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rating?: number
          message?: string | null
          category?: "general" | "product" | "service" | "website" | "support"
          status?: "pending" | "reviewed" | "resolved"
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
