import type { SupabaseClient } from "@supabase/supabase-js";

import type { BundleInfo, CategoryInfo, ShopInfo, SlotSummary } from "@/components/bento/StoreView";
import type { SocialLinks, ShopReviews } from "@/lib/types";

export type ShopStorefrontEditorPayload = {
  shopId: string;
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped: boolean;
  reviews: ShopReviews | null;
  storefrontBentoLayout: unknown | null;
};

/**
 * Données vitrine (niveau 1) pour l’éditeur de mise en page : aligné sur la page publique /{slug}.
 */
export async function fetchShopStorefrontEditorPayload(
  supabase: SupabaseClient,
  shopId: string
): Promise<ShopStorefrontEditorPayload | null> {
  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, description, logo_url, cover_image_url, owner_photo_url, address, phone, email_contact, social_links, fulfillment_modes, opening_hours, opening_timezone, open_on_public_holidays"
    )
    .eq("id", shopId)
    .single();

  if (!shop) return null;

  // Colonne optionnelle (migration) : requête séparée pour ne pas faire échouer tout le chargement.
  const { data: layoutRow, error: layoutError } = await supabase
    .from("shops")
    .select("storefront_bento_layout")
    .eq("id", shopId)
    .maybeSingle();

  const storefrontBentoLayout =
    !layoutError && layoutRow
      ? (layoutRow as { storefront_bento_layout: unknown | null }).storefront_bento_layout
      : null;

  const { data: groupedRow, error: groupedError } = await supabase
    .from("shops")
    .select("bundles_menu_grouped")
    .eq("id", shopId)
    .maybeSingle();

  const bundlesMenuGrouped =
    !groupedError &&
    groupedRow &&
    typeof (groupedRow as { bundles_menu_grouped?: unknown }).bundles_menu_grouped === "boolean"
      ? (groupedRow as { bundles_menu_grouped: boolean }).bundles_menu_grouped
      : false;

  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, icon_emoji, cover_image_url, description, display_order")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("display_order");

  const catList = rawCategories ?? [];
  const catIds = catList.map((c) => c.id);

  let productCounts: Record<string, number> = {};
  if (catIds.length > 0) {
    const { data: countRows } = await supabase
      .from("products")
      .select("category_id")
      .in("category_id", catIds)
      .eq("is_available", true);
    productCounts = (countRows ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.category_id] = (acc[p.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const categories: CategoryInfo[] = catList.map((c) => ({
    id: c.id,
    name: c.name,
    icon_emoji: c.icon_emoji,
    cover_image_url: c.cover_image_url,
    description: c.description,
    productCount: productCounts[c.id] ?? 0,
  }));

  const { data: rawBundles } = await supabase
    .from("bundles")
    .select("id, name, description, price, image_url")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const bundleList = rawBundles ?? [];
  const bundleIds = bundleList.map((b) => b.id);

  type SlotRow = {
    bundle_id: string;
    label: string;
    quantity: number;
    category_id: string;
  };
  let slotsMap: Record<string, SlotRow[]> = {};

  if (bundleIds.length > 0) {
    const { data: slots } = await supabase
      .from("bundle_slots")
      .select("bundle_id, label, quantity, category_id")
      .in("bundle_id", bundleIds)
      .order("display_order");

    slotsMap = (slots ?? []).reduce<Record<string, SlotRow[]>>((acc, s) => {
      if (!acc[s.bundle_id]) acc[s.bundle_id] = [];
      acc[s.bundle_id].push(s);
      return acc;
    }, {});
  }

  const catMap = Object.fromEntries(
    catList.map((c) => [c.id, { name: c.name, emoji: c.icon_emoji }])
  );

  const bundles: BundleInfo[] = bundleList.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    price: Number(b.price),
    image_url: b.image_url,
    slots: (slotsMap[b.id] ?? []).map<SlotSummary>((s) => ({
      label: s.label,
      quantity: s.quantity,
      categoryName: catMap[s.category_id]?.name ?? "",
      categoryEmoji: catMap[s.category_id]?.emoji ?? "🍽️",
      categoryId: s.category_id,
    })),
  }));

  const { data: shopReviews } = await supabase
    .from("shop_reviews")
    .select("*")
    .eq("shop_id", shop.id)
    .single();

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  const shopInfo: ShopInfo = {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    logo_url: shop.logo_url,
    cover_image_url: shop.cover_image_url,
    owner_photo_url: shop.owner_photo_url,
    address: shop.address,
    phone: shop.phone,
    email_contact: (shop as { email_contact: string | null }).email_contact ?? null,
    social_links: (shop.social_links ?? {}) as SocialLinks,
    fulfillment_modes: fulfillmentModes,
    opening_hours: shop.opening_hours,
    opening_timezone: shop.opening_timezone ?? "Europe/Paris",
    open_on_public_holidays: shop.open_on_public_holidays ?? false,
  };

  return {
    shopId: shop.id,
    shop: shopInfo,
    categories,
    bundles,
    bundlesMenuGrouped,
    reviews: (shopReviews ?? null) as ShopReviews | null,
    storefrontBentoLayout,
  };
}
