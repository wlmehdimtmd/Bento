import "server-only";

import { redirect } from "next/navigation";

import { buildOnboardingPath } from "@/lib/onboarding-flow";
import {
  isOnboardingComplete,
  isShopProfileBasicsComplete,
  isVitrineOnboardingComplete,
} from "@/lib/onboarding-status";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingShopRow = Database["public"]["Tables"]["shops"]["Row"];

/**
 * Charge la boutique de l’utilisateur (shopId optionnel dans l’URL), ou redirige.
 */
export async function loadOwnedShopForOnboarding(
  supabase: SupabaseClient<Database>,
  userId: string,
  shopIdFromQuery: string | undefined
): Promise<OnboardingShopRow> {
  let shop: OnboardingShopRow | null = null;

  if (shopIdFromQuery) {
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopIdFromQuery)
      .eq("owner_id", userId)
      .single();
    shop = data;
  }

  if (!shop) {
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    shop = data;
  }

  if (!shop) {
    redirect("/register");
  }

  return shop;
}

export function redirectIfOnboardingFinished(socialLinks: unknown): void {
  if (isOnboardingComplete(socialLinks)) {
    redirect("/dashboard");
  }
}

export function redirectIfVitrineNotDone(shopId: string, socialLinks: unknown): void {
  if (!isVitrineOnboardingComplete(socialLinks)) {
    redirect(buildOnboardingPath("shop", shopId));
  }
}

export function redirectIfVitrineDoneToCatalog(shopId: string, socialLinks: unknown): void {
  if (isVitrineOnboardingComplete(socialLinks)) {
    redirect(buildOnboardingPath("catalog", shopId));
  }
}

/**
 * Comptes créés avant `_ob_vitrine` : si la fiche est déjà personnalisée et les modes
 * de commande renseignés, on pose le drapeau et on envoie au choix catalogue.
 */
export async function backfillLegacyVitrineThenRedirectToCatalog(
  supabase: SupabaseClient<Database>,
  shop: OnboardingShopRow
): Promise<void> {
  if (isVitrineOnboardingComplete(shop.social_links)) return;
  if (!isShopProfileBasicsComplete({ name: shop.name, slug: shop.slug })) return;
  const fm = shop.fulfillment_modes;
  if (!Array.isArray(fm) || fm.length === 0) return;

  const prev =
    typeof shop.social_links === "object" && shop.social_links !== null
      ? (shop.social_links as Record<string, unknown>)
      : {};
  const social_links = { ...prev, _ob_vitrine: 1 } as Json;

  await supabase.from("shops").update({ social_links }).eq("id", shop.id);
  redirect(buildOnboardingPath("catalog", shop.id));
}
