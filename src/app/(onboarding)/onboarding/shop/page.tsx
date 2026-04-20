import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingShopStep } from "@/components/onboarding/OnboardingShopStep";
import { buildOnboardingPath } from "@/lib/onboarding-flow";
import { isVitrineOnboardingComplete } from "@/lib/onboarding-status";
import {
  backfillLegacyVitrineThenRedirectToCatalog,
  loadOwnedShopForOnboarding,
  redirectIfOnboardingFinished,
} from "@/lib/onboarding-load-shop";

export const metadata = { title: "Configurer ma vitrine — Bento Resto" };

interface Props {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function OnboardingShopPage({ searchParams }: Props) {
  const { shopId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const shop = await loadOwnedShopForOnboarding(supabase, user.id, shopId);

  redirectIfOnboardingFinished(shop.social_links);

  await backfillLegacyVitrineThenRedirectToCatalog(supabase, shop);

  if (isVitrineOnboardingComplete(shop.social_links)) {
    redirect(buildOnboardingPath("catalog", shop.id));
  }

  const socialLinks =
    typeof shop.social_links === "object" && shop.social_links !== null
      ? (shop.social_links as Record<string, unknown>)
      : {};

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  return (
    <OnboardingShopStep
      shopId={shop.id}
      initialData={{
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        address: shop.address,
        phone: shop.phone,
        email_contact: shop.email_contact,
        logo_url: shop.logo_url,
        cover_image_url: shop.cover_image_url,
        owner_photo_url: shop.owner_photo_url,
        chef_name: (typeof socialLinks.chef_name === "string" ? socialLinks.chef_name : "") || "",
        google_maps_url:
          (typeof socialLinks.google_maps_url === "string" ? socialLinks.google_maps_url : "") ||
          "",
        social_links: socialLinks,
        fulfillment_modes: fulfillmentModes,
      }}
    />
  );
}
