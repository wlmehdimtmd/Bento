import type { SupabaseClient } from "@supabase/supabase-js";

import type { ShopInfo, CategoryInfo, BundleInfo, SlotSummary } from "@/components/bento/StoreView";
import type { SocialLinks, StorefrontPhoto } from "@/lib/types";
import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { coerceStorefrontThemeKey, coerceStorefrontThemeOverrides, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";
import { fetchShopLabelsForPublic, type ProductLabelOption } from "@/lib/shop-labels";
import { pickLocalized, type AppLocale } from "@/lib/i18n";

export type PublicShopPagePayload = {
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped: boolean;
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
  is_active: boolean;
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
  name_fr?: string | null;
  name_en?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  storefront_bento_layout?: unknown | null;
  storefront_theme_key?: unknown | null;
  storefront_theme_overrides?: unknown | null;
  bundles_menu_grouped?: unknown | null;
};

/**
 * Données vitrine publique (aligné sur `/(public)/[slug]/page.tsx`) par slug ou par id.
 */
export type PublicShopFetchOpts =
  | { slug: string }
  /** Chargement par id : visibilité (boutique inactive, etc.) gérée par la RLS. */
  | { id: string };

export async function fetchPublicShopPagePayload(
  supabase: SupabaseClient,
  opts: PublicShopFetchOpts,
  locale: AppLocale = "fr"
): Promise<PublicShopPagePayload | null> {
  let q = supabase
    .from("shops")
    .select(
      "id, name, slug, is_active, description, name_fr, name_en, description_fr, description_en, logo_url, cover_image_url, address, phone, email_contact, social_links, fulfillment_modes, opening_hours, opening_timezone, open_on_public_holidays, stripe_account_id, storefront_bento_layout, storefront_theme_key, storefront_theme_overrides, bundles_menu_grouped"
    );

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

  const savedStorefrontLayout = s.storefront_bento_layout ?? null;

  const storefrontThemeKey = coerceStorefrontThemeKey(s.storefront_theme_key ?? null);
  const storefrontThemeOverrides = coerceStorefrontThemeOverrides(
    s.storefront_theme_overrides ?? null
  );

  const bundlesMenuGrouped =
    typeof s.bundles_menu_grouped === "boolean" ? s.bundles_menu_grouped : false;

  const { data: rawCategories } = await supabase
    .from("categories")
    .select("id, name, name_fr, name_en, icon_emoji, description, description_fr, description_en, display_order")
    .eq("shop_id", s.id)
    .eq("is_active", true)
    .order("display_order");

  const catList = (rawCategories ?? []) as Array<{
    id: string;
    name: string;
    name_fr?: string | null;
    name_en?: string | null;
    icon_emoji: string;
    description: string | null;
    description_fr?: string | null;
    description_en?: string | null;
  }>;

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
    name: pickLocalized(locale, {
      fr: c.name_fr,
      en: c.name_en,
      legacy: c.name,
    }) ?? c.name,
    icon_emoji: c.icon_emoji,
    description: pickLocalized(locale, {
      fr: c.description_fr,
      en: c.description_en,
      legacy: c.description,
    }),
    productCount: productCounts[c.id] ?? 0,
  }));

  const { data: rawBundles } = await supabase
    .from("bundles")
    .select("id, name, name_fr, name_en, description, description_fr, description_en, price, image_url")
    .eq("shop_id", s.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const bundleList = (rawBundles ?? []) as Array<{
    id: string;
    name: string;
    name_fr?: string | null;
    name_en?: string | null;
    description: string | null;
    description_fr?: string | null;
    description_en?: string | null;
    price: number;
    image_url: string | null;
  }>;
  const bundleIds = bundleList.map((b) => b.id);

  type SlotRow = {
    bundle_id: string;
    label: string;
    label_fr?: string | null;
    label_en?: string | null;
    quantity: number;
    category_id: string;
    excluded_product_ids: string[] | null;
  };
  let slotsMap: Record<string, SlotRow[]> = {};

  if (bundleIds.length > 0) {
    const { data: slots } = await supabase
      .from("bundle_slots")
      .select("bundle_id, label, label_fr, label_en, quantity, category_id, excluded_product_ids")
      .in("bundle_id", bundleIds)
      .order("display_order");

    slotsMap = (slots ?? []).reduce<Record<string, SlotRow[]>>((acc, row) => {
      if (!acc[row.bundle_id]) acc[row.bundle_id] = [];
      acc[row.bundle_id].push(row);
      return acc;
    }, {});
  }

  const catMap = Object.fromEntries(
    catList.map((c) => [
      c.id,
      {
        name:
          pickLocalized(locale, {
            fr: c.name_fr,
            en: c.name_en,
            legacy: c.name,
          }) ?? c.name,
        emoji: c.icon_emoji,
      },
    ])
  );

  const bundles: BundleInfo[] = bundleList.map((b) => ({
    id: b.id,
    name:
      pickLocalized(locale, {
        fr: b.name_fr,
        en: b.name_en,
        legacy: b.name,
      }) ?? b.name,
    description: pickLocalized(locale, {
      fr: b.description_fr,
      en: b.description_en,
      legacy: b.description,
    }),
    price: Number(b.price),
    image_url: b.image_url,
    slots: (slotsMap[b.id] ?? []).map<SlotSummary>((row) => ({
      label: pickLocalized(locale, {
        fr: row.label_fr,
        en: row.label_en,
        legacy: row.label,
      }) ?? row.label,
      quantity: row.quantity,
      categoryName: catMap[row.category_id]?.name ?? "",
      categoryEmoji: catMap[row.category_id]?.emoji ?? "🍽️",
      categoryId: row.category_id,
      excludedProductIds: Array.isArray(row.excluded_product_ids)
        ? row.excluded_product_ids
        : [],
    })),
  }));

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

  const shopLabels = await fetchShopLabelsForPublic(supabase, s.id, locale);

  const shopInfo: ShopInfo = {
    id: s.id,
    name: pickLocalized(locale, { fr: s.name_fr, en: s.name_en, legacy: s.name }) ?? s.name,
    slug: s.slug,
    is_active: s.is_active,
    description: pickLocalized(locale, {
      fr: s.description_fr,
      en: s.description_en,
      legacy: s.description,
    }),
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
    storefrontPhotos: (storefrontPhotos ?? []) as StorefrontPhoto[],
    savedStorefrontLayout,
    storefrontThemeKey,
    storefrontThemeOverrides,
    stripeAccountId: s.stripe_account_id,
    shopLabels,
  };
}
