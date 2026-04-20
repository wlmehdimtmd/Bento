import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSuccessStep } from "@/components/onboarding/OnboardingSuccessStep";
import {
  loadOwnedShopForOnboarding,
  redirectIfOnboardingFinished,
  redirectIfVitrineNotDone,
} from "@/lib/onboarding-load-shop";

export const metadata = { title: "Votre vitrine est prête — Bento Resto" };

interface Props {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function OnboardingSuccessPage({ searchParams }: Props) {
  const { shopId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const shop = await loadOwnedShopForOnboarding(supabase, user.id, shopId);

  redirectIfOnboardingFinished(shop.social_links);

  redirectIfVitrineNotDone(shop.id, shop.social_links);

  return <OnboardingSuccessStep shopSlug={shop.slug} shopId={shop.id} />;
}
