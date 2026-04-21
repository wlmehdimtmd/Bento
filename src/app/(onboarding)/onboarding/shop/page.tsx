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
  searchParams: Promise<{ shopId?: string; subStep?: string }>;
}

export default async function OnboardingShopPage({ searchParams }: Props) {
  const { shopId, subStep } = await searchParams;
  const supabase = await createClient();
  const requestedSubStep = Number(subStep);
  const initialSubStep = requestedSubStep >= 1 && requestedSubStep <= 4 ? requestedSubStep : 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const shop = await loadOwnedShopForOnboarding(supabase, user.id, shopId);

  redirectIfOnboardingFinished(shop.social_links);

  await backfillLegacyVitrineThenRedirectToCatalog(supabase, shop, {
    skipRedirect: initialSubStep > 1,
  });

  const shouldForceCatalog = isVitrineOnboardingComplete(shop.social_links) && initialSubStep === 1;

  if (shouldForceCatalog) {
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
      initialSubStep={initialSubStep}
      initialData={{
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        address: shop.address,
        phone: shop.phone,
        email_contact: shop.email_contact,
        logo_url: shop.logo_url,
        cover_image_url: shop.cover_image_url,
        social_links: socialLinks,
        fulfillment_modes: fulfillmentModes,
      }}
    />
  );
}
