import type { SupabaseClient } from "@supabase/supabase-js";

import type { ShopInfo, CategoryInfo, BundleInfo, SlotSummary } from "@/components/bento/StoreView";
import type { SocialLinks, ShopReviews, StorefrontPhoto } from "@/lib/types";
import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { coerceStorefrontThemeKey, coerceStorefrontThemeOverrides, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";
import { fetchShopLabelsForPublic, type ProductLabelOption } from "@/lib/shop-labels";

export type PublicShopPagePayload = {
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped: boolean;
  reviews: ShopReviews | null;
  storefrontPhotos: StorefrontPhoto[];
  savedStorefrontLayout: unknown | null;
  storefrontThemeKey: CategoryThemeKey;
  storefrontThemeOverrides: StorefrontThemeOverrides;
  stripeAccountId: string | null;
  shopLabels: ProductLabelOption[];
};

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  email_contact: string | null;
  social_links: unknown;
  fulfillment_modes: unknown;
  opening_hours: unknown | null;
  opening_timezone: string | null;
  open_on_public_holidays: boolean | null;
  stripe_account_id: string | null;
};

/**
 * Données vitrine publique (aligné sur `/(public)/[slug]/page.tsx`) par slug ou par id.
 */
export type PublicShopFetchOpts =
  | { slug: string }
  /** `includeInactiveShop` : prévisualisation onboarding / back-office (boutique pas encore active). */
  | { id: string; includeInactiveShop?: boolean };

export async function fetchPublicShopPagePayload(
  supabase: SupabaseClient,
  opts: PublicShopFetchOpts
): Promise<PublicShopPagePayload | null> {
  let q = supabase
    .from("shops")
    .select(
      "id, name, slug, description, logo_url, cover_image_url, address, phone, email_contact, social_links, fulfillment_modes, opening_hours, opening_timezone, open_on_public_holidays, stripe_account_id"
    );

  const skipActiveFilter = "id" in opts && opts.includeInactiveShop === true;
  if (!skipActiveFilter) {
    q = q.eq("is_active", true);
  }

  if ("slug" in opts) {
    q = q.eq("slug", opts.slug);
  } else {
    q = q.eq("id", opts.id);
  }

  const { data: shop, error: shopError } = await q.single();

  if (process.env.NODE_ENV === "development" && shopError) {
    console.error(
      `[fetchPublicShopPagePayload] code=${shopError.code} message=${shopError.message}` +
        (shopError.details ? ` details=${shopError.details}` : "")
    );
  }

  if (!shop) return null;

  const s = shop as ShopRow;

  const { data: layoutRow, error: layoutError } = await supabase
    .from("shops")
    .select("storefront_bento_layout")
    .eq("id", s.id)
    .maybeSingle();

  const savedStorefrontLayout =
    !layoutError && layoutRow
      ? (layoutRow as { storefront_bento_layout: unknown | null }).storefront_bento_layout
      : null;

  const { data: themeRow, error: themeError } = await supabase
    .from("shops")
    .select("storefront_theme_key, storefront_theme_overrides")
    .eq("id", s.id)
    .maybeSingle();

  const storefrontThemeKey = coerceStorefrontThemeKey(
    !themeError && themeRow
      ? (themeRow as { storefront_theme_key?: unknown }).storefront_theme_key
      : null
  );
  const storefrontThemeOverrides = coerceStorefrontThemeOverrides(
    !themeError && themeRow
      ? (themeRow as { storefront_theme_overrides?: unknown }).storefront_theme_overrides
      : null
  );

  const { data: groupedRow, error: groupedError } = await supabase
    .from("shops")
    .select("bundles_menu_grouped")
    .eq("id", s.id)
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
    .eq("shop_id", s.id)
    .eq("is_active", true)
    .order("display_order");

  const catList = rawCategories ?? [];

  let productCounts: Record<string, number> = {};
  if (catList.length > 0) {
    const catIds = catList.map((c) => c.id);
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
    .eq("shop_id", s.id)
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

    slotsMap = (slots ?? []).reduce<Record<string, SlotRow[]>>((acc, row) => {
      if (!acc[row.bundle_id]) acc[row.bundle_id] = [];
      acc[row.bundle_id].push(row);
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
    slots: (slotsMap[b.id] ?? []).map<SlotSummary>((row) => ({
      label: row.label,
      quantity: row.quantity,
      categoryName: catMap[row.category_id]?.name ?? "",
      categoryEmoji: catMap[row.category_id]?.emoji ?? "🍽️",
      categoryId: row.category_id,
    })),
  }));

  const { data: shopReviews } = await supabase
    .from("shop_reviews")
    .select("*")
    .eq("shop_id", s.id)
    .single();

  const { data: storefrontPhotos } = await supabase
    .from("shop_storefront_photos")
    .select("id, image_url, caption, is_visible, display_order")
    .eq("shop_id", s.id)
    .eq("is_visible", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  const fulfillmentModes = Array.isArray(s.fulfillment_modes)
    ? (s.fulfillment_modes as string[])
    : [];

  const shopLabels = await fetchShopLabelsForPublic(supabase, s.id);

  const shopInfo: ShopInfo = {
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    logo_url: s.logo_url,
    cover_image_url: s.cover_image_url,
    address: s.address,
    phone: s.phone,
    email_contact: s.email_contact ?? null,
    social_links: (s.social_links ?? {}) as SocialLinks,
    fulfillment_modes: fulfillmentModes,
    opening_hours: s.opening_hours,
    opening_timezone: s.opening_timezone ?? "Europe/Paris",
    open_on_public_holidays: s.open_on_public_holidays ?? false,
  };

  return {
    shop: shopInfo,
    categories,
    bundles,
    bundlesMenuGrouped,
    reviews: (shopReviews ?? null) as ShopReviews | null,
    storefrontPhotos: (storefrontPhotos ?? []) as StorefrontPhoto[],
    savedStorefrontLayout,
    storefrontThemeKey,
    storefrontThemeOverrides,
    stripeAccountId: s.stripe_account_id,
    shopLabels,
  };
}
