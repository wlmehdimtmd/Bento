import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildOnboardingPath } from "@/lib/onboarding-flow";
import { loadOwnedShopForOnboarding } from "@/lib/onboarding-load-shop";

interface Props {
  searchParams: Promise<{ shopId?: string }>;
}

export default async function OnboardingBundlesRedirectPage({ searchParams }: Props) {
  const { shopId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const shop = await loadOwnedShopForOnboarding(supabase, user.id, shopId);
  redirect(buildOnboardingPath("catalog", shop.id));
}
