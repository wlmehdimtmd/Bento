import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ShopInfo } from "@/components/bento/StoreView";
import type { SocialLinks } from "@/lib/types";
import { OnboardingCatalogWorkspace } from "@/components/onboarding/OnboardingCatalogWorkspace";
import type { OnboardingProductRow } from "@/components/onboarding/OnboardingCatalogWorkspace";
import {
  fetchPublicShopPagePayload,
  type PublicShopPagePayload,
} from "@/lib/fetchPublicShopPagePayload";
import { DEFAULT_CATEGORY_THEME_KEY } from "@/lib/categoryThemeTokens";
import { coerceStorefrontThemeOverrides } from "@/lib/storefrontTheme";
import {
  backfillLegacyVitrineThenRedirectToCatalog,
  loadOwnedShopForOnboarding,
  redirectIfOnboardingFinished,
  redirectIfVitrineNotDone,
} from "@/lib/onboarding-load-shop";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Your catalog — Bento Resto" };

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

function emptyPayloadFromShop(shop: {
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
}): PublicShopPagePayload {
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
    address: shop.address,
    phone: shop.phone,
    email_contact: shop.email_contact ?? null,
    social_links: (shop.social_links ?? {}) as SocialLinks,
    fulfillment_modes: fulfillmentModes,
    opening_hours: shop.opening_hours,
    opening_timezone: shop.opening_timezone ?? "Europe/Paris",
    open_on_public_holidays: shop.open_on_public_holidays ?? false,
  };
  return {
    shop: shopInfo,
    categories: [],
    bundles: [],
    bundlesMenuGrouped: false,
    reviews: null,
    storefrontPhotos: [],
    savedStorefrontLayout: null,
    storefrontThemeKey: DEFAULT_CATEGORY_THEME_KEY,
    storefrontThemeOverrides: coerceStorefrontThemeOverrides(null),
    shopLabels: [],
    stripeAccountId: shop.stripe_account_id,
  };
}

interface Props {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function OnboardingCatalogPage({ searchParams }: Props) {
  const { shopId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const shop = await loadOwnedShopForOnboarding(supabase, user.id, shopId);

  redirectIfOnboardingFinished(shop.social_links);

  await backfillLegacyVitrineThenRedirectToCatalog(supabase, shop);

  redirectIfVitrineNotDone(shop.id, shop.social_links);

  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const payload =
    (await fetchPublicShopPagePayload(supabase, { id: shop.id }, locale)) ??
    emptyPayloadFromShop(shop);

  const catIds = payload.categories.map((c) => c.id);
  let initialProducts: OnboardingProductRow[] = [];
  if (catIds.length > 0) {
    const { data: prodRows } = await supabase
      .from("products")
      .select(
        "id, category_id, name, description, price, image_url, tags, is_available, display_order"
      )
      .in("category_id", catIds)
      .order("display_order");

    initialProducts = (prodRows ?? []).map((p) => ({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: p.price,
      image_url: p.image_url,
      tags: normalizeTags(p.tags),
      is_available: p.is_available,
      display_order: p.display_order,
    }));
  }

  return (
    <OnboardingCatalogWorkspace
      shopId={shop.id}
      payload={payload}
      initialProducts={initialProducts}
    />
  );
}
