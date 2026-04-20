// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type ShopType =
  | "restaurant"
  | "bakery"
  | "cafe"
  | "foodtruck"
  | "catering"
  | "other";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export type FulfillmentMode = "dine_in" | "takeaway" | "delivery";

// ─── Social Links ─────────────────────────────────────────────────────────────

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  /** Lien fiche Google Maps / avis (formulaire vitrine). */
  google_maps_url?: string;
  /** Si `false`, adresse / téléphone / email ne s’affichent pas sur la carte vitrine. */
  show_contact_on_storefront?: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: "customer" | "shop_owner" | "admin";
  created_at: string;
  updated_at: string;
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ShopType;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  social_links: SocialLinks;
  fulfillment_modes: FulfillmentMode[];
  is_active: boolean;
  is_verified: boolean;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Tag ──────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  shop_id: string;
  name: string;
  color: string | null;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[];
  labels: string[];
  tags: Tag[];
  is_available: boolean;
  is_featured: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

export interface BundleSlot {
  id: string;
  bundle_id: string;
  name: string;
  description: string | null;
  min_choices: number;
  max_choices: number;
  position: number;
  product_ids: string[];
}

export interface Bundle {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  slots: BundleSlot[];
  is_available: boolean;
  is_featured: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  bundle_id: string | null;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
  bundle_selections: Record<string, string[]> | null;
}

export interface Order {
  id: string;
  shop_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  fulfillment_mode: FulfillmentMode;
  notes: string | null;
  table_number: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Shop Reviews ─────────────────────────────────────────────────────────────

export interface ShopReviews {
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
}

export interface StorefrontPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  is_visible: boolean;
  display_order: number;
}

// ─── Template System ──────────────────────────────────────────────────────────

export interface BusinessType {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoryTemplate {
  id: string;
  business_type_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductTemplate {
  id: string;
  category_template_id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  tags: string[];
  option_label: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface BundleTemplate {
  id: string;
  business_type_id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface BundleTemplateSlot {
  id: string;
  bundle_template_id: string;
  category_template_id: string | null;
  label: string;
  position: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  product_id?: string;
  bundle_id?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  bundle_selections?: Record<string, string[]>;
  image_url?: string | null;
}

/** Produit extrait par l’IA (import menu) — avant insertion en base */
export interface ExtractedProduct {
  name: string;
  description: string;
  price: number;
  category_suggestion: string;
  tags: string[];
  option_label?: string | null;
  confidence: "high" | "medium" | "low";
}
