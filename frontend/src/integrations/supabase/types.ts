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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          area: string | null
          avatar_url: string | null
          avg_rating: number
          base_price_paise: number
          bio: string | null
          cancellation_policy: string
          city: string
          created_at: string
          email: string | null
          hero_image_url: string | null
          id: string
          languages: string[]
          name: string
          offers_at_home: boolean
          offers_studio: boolean
          owner_id: string | null
          phone: string | null
          review_count: number
          service_radius_km: number
          slug: string
          specialties: string[]
          tagline: string | null
          updated_at: string
          verified: boolean
          years_experience: number
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          avg_rating?: number
          base_price_paise?: number
          bio?: string | null
          cancellation_policy?: string
          city: string
          created_at?: string
          email?: string | null
          hero_image_url?: string | null
          id?: string
          languages?: string[]
          name: string
          offers_at_home?: boolean
          offers_studio?: boolean
          owner_id?: string | null
          phone?: string | null
          review_count?: number
          service_radius_km?: number
          slug: string
          specialties?: string[]
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          avg_rating?: number
          base_price_paise?: number
          bio?: string | null
          cancellation_policy?: string
          city?: string
          created_at?: string
          email?: string | null
          hero_image_url?: string | null
          id?: string
          languages?: string[]
          name?: string
          offers_at_home?: boolean
          offers_studio?: boolean
          owner_id?: string | null
          phone?: string | null
          review_count?: number
          service_radius_km?: number
          slug?: string
          specialties?: string[]
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          years_experience?: number
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          artist_id: string
          booked_count: number
          booking_id: string | null
          capacity: number
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          status: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          artist_id: string
          booked_count?: number
          booking_id?: string | null
          capacity?: number
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          artist_id?: string
          booked_count?: number
          booking_id?: string | null
          capacity?: number
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          duration_minutes: number
          id: string
          price_paise: number
          service_id: string
          title_snapshot: string
        }
        Insert: {
          booking_id: string
          duration_minutes: number
          id?: string
          price_paise: number
          service_id: string
          title_snapshot: string
        }
        Update: {
          booking_id?: string
          duration_minutes?: number
          id?: string
          price_paise?: number
          service_id?: string
          title_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          artist_id: string
          cancellation_policy_snapshot: string
          cancellation_reason: string | null
          cancelled_at: string | null
          city: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          ends_at: string
          id: string
          is_advance: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          notes: string | null
          paid_paise: number
          refund_paise: number
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          artist_id: string
          cancellation_policy_snapshot: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          ends_at: string
          id?: string
          is_advance?: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          notes?: string | null
          paid_paise?: number
          refund_paise?: number
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_paise: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          artist_id?: string
          cancellation_policy_snapshot?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          ends_at?: string
          id?: string
          is_advance?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          notes?: string | null
          paid_paise?: number
          refund_paise?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          artist_id: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_paise: number
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_paise?: number
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_media: {
        Row: {
          artist_id: string
          before_url: string | null
          caption: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          sort_order: number
          url: string
        }
        Insert: {
          artist_id: string
          before_url?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url: string
        }
        Update: {
          artist_id?: string
          before_url?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_media_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_address: string | null
          default_city: string | null
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_address?: string | null
          default_city?: string | null
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          artist_id: string
          body: string | null
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          title: string | null
          verified: boolean
        }
        Insert: {
          artist_id: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          title?: string | null
          verified?: boolean
        }
        Update: {
          artist_id?: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          title?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          artist_id: string
          available_at_home: boolean
          available_at_studio: boolean
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string
          duration_minutes: number
          id: string
          inclusions: string[]
          price_paise: number
          products_used: string | null
          title: string
        }
        Insert: {
          active?: boolean
          artist_id: string
          available_at_home?: boolean
          available_at_studio?: boolean
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description: string
          duration_minutes: number
          id?: string
          inclusions?: string[]
          price_paise: number
          products_used?: string | null
          title: string
        }
        Update: {
          active?: boolean
          artist_id?: string
          available_at_home?: boolean
          available_at_studio?: boolean
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          inclusions?: string[]
          price_paise?: number
          products_used?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          status: Database["public"]["Enums"]["thread_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          status?: Database["public"]["Enums"]["thread_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          status?: Database["public"]["Enums"]["thread_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalc_artist_rating: { Args: { _artist_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      location_type: "studio" | "at_home"
      media_kind: "photo" | "video" | "before_after"
      payment_kind: "advance" | "full" | "balance" | "refund"
      payment_status:
        | "created"
        | "paid"
        | "failed"
        | "refunded"
        | "partial_refund"
      service_category:
        | "makeup"
        | "hair"
        | "nails"
        | "skincare"
        | "mehndi"
        | "package"
      slot_status: "open" | "booked" | "blocked"
      thread_status: "open" | "closed"
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
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      location_type: ["studio", "at_home"],
      media_kind: ["photo", "video", "before_after"],
      payment_kind: ["advance", "full", "balance", "refund"],
      payment_status: [
        "created",
        "paid",
        "failed",
        "refunded",
        "partial_refund",
      ],
      service_category: [
        "makeup",
        "hair",
        "nails",
        "skincare",
        "mehndi",
        "package",
      ],
      slot_status: ["open", "booked", "blocked"],
      thread_status: ["open", "closed"],
    },
  },
} as const
