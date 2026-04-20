export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      auth_events: {
        Row: {
          id: string;
          event: string;
          user_id: string | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event: string;
          user_id?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event?: string;
          user_id?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          description: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          owner_photo_url: string | null;
          address: string | null;
          phone: string | null;
          email_contact: string | null;
          social_links: Json;
          stripe_account_id: string | null;
          is_active: boolean;
          fulfillment_modes: Json;
          storefront_bento_layout: Json | null;
          opening_hours: Json | null;
          opening_timezone: string;
          open_on_public_holidays: boolean;
          bundles_menu_grouped: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          type: string;
          description?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          owner_photo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email_contact?: string | null;
          social_links?: Json;
          stripe_account_id?: string | null;
          is_active?: boolean;
          fulfillment_modes?: Json;
          storefront_bento_layout?: Json | null;
          opening_hours?: Json | null;
          opening_timezone?: string;
          open_on_public_holidays?: boolean;
          bundles_menu_grouped?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          type?: string;
          description?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          owner_photo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email_contact?: string | null;
          social_links?: Json;
          stripe_account_id?: string | null;
          is_active?: boolean;
          fulfillment_modes?: Json;
          storefront_bento_layout?: Json | null;
          opening_hours?: Json | null;
          opening_timezone?: string;
          open_on_public_holidays?: boolean;
          bundles_menu_grouped?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          icon_emoji: string;
          cover_image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          description?: string | null;
          icon_emoji?: string;
          cover_image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          description?: string | null;
          icon_emoji?: string;
          cover_image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          tags: Json;
          option_label: string | null;
          is_available: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          tags?: Json;
          option_label?: string | null;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          tags?: Json;
          option_label?: string | null;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      bundles: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bundles_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
      bundle_slots: {
        Row: {
          id: string;
          bundle_id: string;
          category_id: string;
          label: string;
          quantity: number;
          display_order: number;
        };
        Insert: {
          id?: string;
          bundle_id: string;
          category_id: string;
          label: string;
          quantity?: number;
          display_order?: number;
        };
        Update: {
          id?: string;
          bundle_id?: string;
          category_id?: string;
          label?: string;
          quantity?: number;
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "bundle_slots_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bundle_slots_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          shop_id: string;
          order_number: number;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          fulfillment_mode: string;
          table_number: string | null;
          delivery_address: string | null;
          status: string;
          total_amount: number;
          stripe_payment_intent_id: string | null;
          stripe_payment_status: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          order_number?: number;
          customer_name: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          fulfillment_mode: string;
          table_number?: string | null;
          delivery_address?: string | null;
          status?: string;
          total_amount: number;
          stripe_payment_intent_id?: string | null;
          stripe_payment_status?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          order_number?: number;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string | null;
          fulfillment_mode?: string;
          table_number?: string | null;
          delivery_address?: string | null;
          status?: string;
          total_amount?: number;
          stripe_payment_intent_id?: string | null;
          stripe_payment_status?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          bundle_id: string | null;
          quantity: number;
          unit_price: number;
          option_value: string | null;
          special_note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          bundle_id?: string | null;
          quantity?: number;
          unit_price: number;
          option_value?: string | null;
          special_note?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          bundle_id?: string | null;
          quantity?: number;
          unit_price?: number;
          option_value?: string | null;
          special_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      platform_settings: {
        Row: {
          id: string;
          demo_shop_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          demo_shop_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          demo_shop_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_settings_demo_shop_id_fkey";
            columns: ["demo_shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
      shop_reviews: {
        Row: {
          shop_id: string;
          google_enabled: boolean;
          google_place_id: string | null;
          google_place_name: string | null;
          google_place_address: string | null;
          google_rating: number | null;
          google_review_count: number | null;
          google_url: string | null;
          google_last_fetched: string | null;
          tripadvisor_enabled: boolean;
          tripadvisor_url: string | null;
          tripadvisor_name: string | null;
          tripadvisor_rating: number | null;
          tripadvisor_review_count: number | null;
          tripadvisor_last_fetched: string | null;
          updated_at: string;
        };
        Insert: {
          shop_id: string;
          google_enabled?: boolean;
          google_place_id?: string | null;
          google_place_name?: string | null;
          google_place_address?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          google_url?: string | null;
          google_last_fetched?: string | null;
          tripadvisor_enabled?: boolean;
          tripadvisor_url?: string | null;
          tripadvisor_name?: string | null;
          tripadvisor_rating?: number | null;
          tripadvisor_review_count?: number | null;
          tripadvisor_last_fetched?: string | null;
          updated_at?: string;
        };
        Update: {
          shop_id?: string;
          google_enabled?: boolean;
          google_place_id?: string | null;
          google_place_name?: string | null;
          google_place_address?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          google_url?: string | null;
          google_last_fetched?: string | null;
          tripadvisor_enabled?: boolean;
          tripadvisor_url?: string | null;
          tripadvisor_name?: string | null;
          tripadvisor_rating?: number | null;
          tripadvisor_review_count?: number | null;
          tripadvisor_last_fetched?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_reviews_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: true;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_shop_owner: {
        Args: { p_shop_id: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
