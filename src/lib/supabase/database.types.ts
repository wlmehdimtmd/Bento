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
      bundle_slots: {
        Row: {
          bundle_id: string
          category_id: string
          display_order: number | null
          id: string
          label: string
          label_en: string | null
          label_fr: string | null
          quantity: number | null
        }
        Insert: {
          bundle_id: string
          category_id: string
          display_order?: number | null
          id?: string
          label: string
          label_en?: string | null
          label_fr?: string | null
          quantity?: number | null
        }
        Update: {
          bundle_id?: string
          category_id?: string
          display_order?: number | null
          id?: string
          label?: string
          label_en?: string | null
          label_fr?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_slots_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_slots_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_template_slots: {
        Row: {
          bundle_template_id: string | null
          category_template_id: string | null
          id: string
          label: string
          position: number | null
        }
        Insert: {
          bundle_template_id?: string | null
          category_template_id?: string | null
          id?: string
          label: string
          position?: number | null
        }
        Update: {
          bundle_template_id?: string | null
          category_template_id?: string | null
          id?: string
          label?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_template_slots_bundle_template_id_fkey"
            columns: ["bundle_template_id"]
            isOneToOne: false
            referencedRelation: "bundle_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_template_slots_category_template_id_fkey"
            columns: ["category_template_id"]
            isOneToOne: false
            referencedRelation: "category_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_templates: {
        Row: {
          business_type_id: string | null
          created_at: string | null
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
        }
        Insert: {
          business_type_id?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
        }
        Update: {
          business_type_id?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_templates_business_type_id_fkey"
            columns: ["business_type_id"]
            isOneToOne: false
            referencedRelation: "business_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          name_fr: string | null
          price: number
          shop_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_fr?: string | null
          price: number
          shop_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_fr?: string | null
          price?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      business_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          display_order: number | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          name_fr: string | null
          shop_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_fr?: string | null
          shop_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_fr?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      category_templates: {
        Row: {
          business_type_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          position: number | null
        }
        Insert: {
          business_type_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: number | null
        }
        Update: {
          business_type_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_templates_business_type_id_fkey"
            columns: ["business_type_id"]
            isOneToOne: false
            referencedRelation: "business_types"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          bundle_id: string | null
          id: string
          option_value: string | null
          order_id: string
          product_id: string | null
          quantity: number
          special_note: string | null
          unit_price: number
        }
        Insert: {
          bundle_id?: string | null
          id?: string
          option_value?: string | null
          order_id: string
          product_id?: string | null
          quantity?: number
          special_note?: string | null
          unit_price: number
        }
        Update: {
          bundle_id?: string | null
          id?: string
          option_value?: string | null
          order_id?: string
          product_id?: string | null
          quantity?: number
          special_note?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          fulfillment_mode: string
          id: string
          notes: string | null
          order_number: number
          paid_at: string | null
          shop_id: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          table_number: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          fulfillment_mode?: string
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          shop_id: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          table_number?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          fulfillment_mode?: string
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          shop_id?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          table_number?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          demo_shop_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          demo_shop_id?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          demo_shop_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_demo_shop_id_fkey"
            columns: ["demo_shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_templates: {
        Row: {
          category_template_id: string | null
          created_at: string | null
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          option_label: string | null
          position: number | null
          tags: string[] | null
        }
        Insert: {
          category_template_id?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          option_label?: string | null
          position?: number | null
          tags?: string[] | null
        }
        Update: {
          category_template_id?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          option_label?: string | null
          position?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "product_templates_category_template_id_fkey"
            columns: ["category_template_id"]
            isOneToOne: false
            referencedRelation: "category_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          name_en: string | null
          name_fr: string | null
          option_label: string | null
          option_label_en: string | null
          option_label_fr: string | null
          price: number
          tags: Json | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          name_en?: string | null
          name_fr?: string | null
          option_label?: string | null
          option_label_en?: string | null
          option_label_fr?: string | null
          price: number
          tags?: Json | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          name_en?: string | null
          name_fr?: string | null
          option_label?: string | null
          option_label_en?: string | null
          option_label_fr?: string | null
          price?: number
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_labels: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          label: string
          label_en: string | null
          label_fr: string | null
          shop_id: string
          updated_at: string
          value: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          label: string
          label_en?: string | null
          label_fr?: string | null
          shop_id: string
          updated_at?: string
          value: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          label_en?: string | null
          label_fr?: string | null
          shop_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_labels_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_storefront_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_visible: boolean
          shop_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_visible?: boolean
          shop_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_visible?: boolean
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_storefront_photos_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          bundles_menu_grouped: boolean
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          email_contact: string | null
          fulfillment_modes: Json | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_en: string | null
          name_fr: string | null
          open_on_public_holidays: boolean
          opening_hours: Json | null
          opening_timezone: string
          owner_id: string
          owner_photo_url: string | null
          phone: string | null
          slug: string
          social_links: Json | null
          storefront_bento_layout: Json | null
          storefront_theme_key: string
          storefront_theme_overrides: Json | null
          stripe_account_id: string | null
          type: string
        }
        Insert: {
          address?: string | null
          bundles_menu_grouped?: boolean
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          email_contact?: string | null
          fulfillment_modes?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_en?: string | null
          name_fr?: string | null
          open_on_public_holidays?: boolean
          opening_hours?: Json | null
          opening_timezone?: string
          owner_id: string
          owner_photo_url?: string | null
          phone?: string | null
          slug: string
          social_links?: Json | null
          storefront_bento_layout?: Json | null
          storefront_theme_key?: string
          storefront_theme_overrides?: Json | null
          stripe_account_id?: string | null
          type: string
        }
        Update: {
          address?: string | null
          bundles_menu_grouped?: boolean
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          email_contact?: string | null
          fulfillment_modes?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_en?: string | null
          name_fr?: string | null
          open_on_public_holidays?: boolean
          opening_hours?: Json | null
          opening_timezone?: string
          owner_id?: string
          owner_photo_url?: string | null
          phone?: string | null
          slug?: string
          social_links?: Json | null
          storefront_bento_layout?: Json | null
          storefront_theme_key?: string
          storefront_theme_overrides?: Json | null
          stripe_account_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_shop_owner: { Args: { p_shop_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
