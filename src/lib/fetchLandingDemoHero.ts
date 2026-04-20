import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveDemoSourceShopId } from "@/lib/platformDemo";

export type LandingDemoHeroTile = {
  id: string;
  imageUrl: string | null;
  label: string;
  price: string;
};

export type LandingDemoHeroData = {
  shopName: string;
  /** Slug vitrine `/{slug}` quand la démo charge une boutique ; null si démo React sans base. */
  shopSlug: string | null;
  tiles: LandingDemoHeroTile[];
};

/** Démo intégrée (sans boutique miroir) — mêmes visuels que l’ancien hero. */
const STATIC_HERO: LandingDemoHeroData = {
  shopName: "Maison Kanpai",
  shopSlug: null,
  tiles: [
    { id: "static-0", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600", label: "Gyoza", price: "8 €" },
    { id: "static-1", imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600", label: "Tataki thon", price: "14 €" },
    { id: "static-2", imageUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600", label: "Ramen tonkotsu", price: "16 €" },
    {
      id: "static-3",
      imageUrl: "https://images.unsplash.com/photo-1742349166781-70e38f10b7ed?w=600&q=80",
      label: "Chirashi saumon",
      price: "19 €",
    },
    { id: "static-4", imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600", label: "Assortiment sushis", price: "18 €" },
    { id: "static-5", imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600", label: "Mochi glacé", price: "8 €" },
  ],
};

function formatPriceEUR(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

function normalizeProductImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/** Remplit jusqu’à 6 tuiles en recyclant la liste (boutique miroir uniquement). */
function padShopTilesToSix(tiles: LandingDemoHeroTile[]): LandingDemoHeroTile[] {
  if (tiles.length === 0) return [];
  const out = [...tiles];
  let i = 0;
  while (out.length < 6) {
    out.push(tiles[i % tiles.length]!);
    i += 1;
  }
  return out.slice(0, 6);
}

/**
 * Données hero landing : même source que `/demo` (platform_settings + repli boutique modèle).
 */
export async function fetchLandingDemoHero(supabase: SupabaseClient): Promise<LandingDemoHeroData> {
  const shopId = await resolveDemoSourceShopId(supabase);
  if (!shopId) {
    return STATIC_HERO;
  }

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("name, slug")
    .eq("id", shopId)
    .eq("is_active", true)
    .maybeSingle();

  if (shopError || !shop) {
    return STATIC_HERO;
  }

  const { data: cats } = await supabase
    .from("categories")
    .select("id")
    .eq("shop_id", shopId)
    .eq("is_active", true)
    .order("display_order");

  const catIds = (cats ?? []).map((c) => c.id);
  if (catIds.length === 0) {
    return {
      shopName: shop.name,
      shopSlug: shop.slug,
      tiles: [],
    };
  }

  const { data: prods } = await supabase
    .from("products")
    .select("id, name, price, image_url, display_order, category_id")
    .in("category_id", catIds)
    .eq("is_available", true)
    .order("display_order");

  const orderIndex = Object.fromEntries(catIds.map((id, idx) => [id, idx]));
  const sorted = (prods ?? []).sort((a, b) => {
    const ai = orderIndex[a.category_id] ?? 999;
    const bi = orderIndex[b.category_id] ?? 999;
    if (ai !== bi) return ai - bi;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  const tiles: LandingDemoHeroTile[] = sorted.map((p) => ({
    id: p.id as string,
    imageUrl: normalizeProductImageUrl(p.image_url),
    label: p.name,
    price: formatPriceEUR(Number(p.price)),
  }));

  if (tiles.length === 0) {
    return {
      shopName: shop.name,
      shopSlug: shop.slug,
      tiles: [],
    };
  }

  return {
    shopName: shop.name,
    shopSlug: shop.slug,
    tiles: padShopTilesToSix(tiles),
  };
}
