import type { Json } from "@/lib/supabase/database.types";

/** Slug réservé : boutique « Maison Kanpai » éditable depuis l’admin (hors miroir explicite). */
export const DEMO_TEMPLATE_SHOP_SLUG = "demo-maison-kanpai";

const OPENING_HOURS: Json = {
  weekly: {
    "0": { closed: true, slots: [] },
    "1": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
    "2": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
    "3": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
    "4": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
    "5": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
    "6": {
      closed: false,
      slots: [
        { open: "12:00", close: "14:30" },
        { open: "19:00", close: "22:30" },
      ],
    },
  },
};

/**
 * Ligne `shops` initiale pour la démo éditable (alignée sur l’ancienne démo statique).
 */
export function buildDemoTemplateShopInsert(ownerId: string) {
  return {
    owner_id: ownerId,
    name: "Maison Kanpai",
    slug: DEMO_TEMPLATE_SHOP_SLUG,
    type: "restaurant" as const,
    description:
      "Cuisine franco-japonaise raffinée.\nProduits frais, savoir-faire artisanal.\n📍 75001 Paris · Lun–Sam 12h–22h30",
    logo_url: null as string | null,
    cover_image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    address: "12 rue du Temple, 75001 Paris",
    phone: "+33 1 23 45 67 89",
    email_contact: null as string | null,
    social_links: {} as unknown as Json,
    fulfillment_modes: ["dine_in", "takeaway"] as unknown as Json,
    opening_hours: OPENING_HOURS,
    opening_timezone: "Europe/Paris",
    open_on_public_holidays: false,
    is_active: true,
  };
}
