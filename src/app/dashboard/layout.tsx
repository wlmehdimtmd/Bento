import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { resolveDashboardOnboardingResumePath } from "@/lib/onboarding-flow";
import { isOnboardingComplete } from "@/lib/onboarding-status";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await resolveIsAdmin(supabase, user)) {
    redirect("/admin");
  }

  // Onboarding guard: redirect new users who haven't completed onboarding
  const { data: primaryShop } = await supabase
    .from("shops")
    .select("id, name, slug, social_links")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (primaryShop) {
    const links =
      typeof primaryShop.social_links === "object" && primaryShop.social_links !== null
        ? (primaryShop.social_links as Record<string, unknown>)
        : {};

    if (!isOnboardingComplete(links)) {
      redirect(
        resolveDashboardOnboardingResumePath({
          id: primaryShop.id as string,
          social_links: primaryShop.social_links,
        })
      );
    }
  }

  const { data: shopsForNav } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const shopIds = (shopsForNav ?? []).map((s) => s.id as string);
  let activeOrdersCount = 0;
  if (shopIds.length > 0) {
    const { count, error: ordersCountError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("shop_id", shopIds)
      .in("status", ["pending", "confirmed", "preparing", "ready"]);
    if (!ordersCountError && count != null) {
      activeOrdersCount = count;
    }
  }

  return (
    <DashboardLayout
      shops={(shopsForNav ?? []).map((s) => ({ id: s.id as string, name: s.name as string }))}
      activeOrdersCount={activeOrdersCount}
    >
      {children}
    </DashboardLayout>
  );
}
