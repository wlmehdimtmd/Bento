import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Anciennes routes `/dashboard/{…}` (sans `shops/[id]`) → `/dashboard/shops/[id]/{…}`.
 * @param subPath chemin après l’id boutique, ex. `categories`, `vitrine/mise-en-page`
 */
export async function redirectLegacyDashboardToShopPath(subPath: string): Promise<never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!shop?.id) redirect("/dashboard");

  redirect(`/dashboard/shops/${shop.id}/${subPath}`);
}
