import { cache } from "react";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  coerceStorefrontThemeKey,
  coerceStorefrontThemeOverrides,
} from "@/lib/storefrontTheme";

/** Ligne `shops` telle que la session courante peut la lire (RLS). */
export type PublicShopLayoutRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  stripe_account_id: string | null;
  fulfillment_modes: unknown;
  storefront_theme_key: unknown;
  storefront_theme_overrides: unknown;
  is_active: boolean;
};

export type ResolvePublicShopSlugResult =
  | { status: "ok"; shop: PublicShopLayoutRow }
  | { status: "inactive_public"; name: string; slug: string }
  | { status: "not_found" };

/**
 * Résout l’accès à une vitrine par slug : boutique visible pour la session,
 * ou vitrine existante mais inactive (lecture service role pour message public),
 * ou introuvable.
 */
export const resolvePublicShopSlug = cache(async (slug: string): Promise<ResolvePublicShopSlugResult> => {
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, stripe_account_id, fulfillment_modes, storefront_theme_key, storefront_theme_overrides, is_active"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (shop) {
    return {
      status: "ok",
      shop: shop as PublicShopLayoutRow,
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { status: "not_found" };
  }

  try {
    const service = createServiceClient();
    const { data: raw } = await service
      .from("shops")
      .select("id, name, slug, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (raw && raw.is_active === false) {
      return { status: "inactive_public", name: raw.name, slug: raw.slug };
    }
  } catch {
    return { status: "not_found" };
  }

  return { status: "not_found" };
});

export function publicShopThemeFromRow(shop: PublicShopLayoutRow) {
  return {
    storefrontThemeKey: coerceStorefrontThemeKey(shop.storefront_theme_key),
    storefrontThemeOverrides: coerceStorefrontThemeOverrides(shop.storefront_theme_overrides),
  };
}
