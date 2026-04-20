"use client";

import { createClient } from "@/lib/supabase/client";

export async function markOnboardingComplete(shopId: string) {
  const supabase = createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("social_links")
    .eq("id", shopId)
    .single();

  const links =
    typeof shop?.social_links === "object" && shop?.social_links !== null
      ? (shop.social_links as Record<string, unknown>)
      : {};

  await supabase
    .from("shops")
    .update({ social_links: { ...links, _ob: 1 } })
    .eq("id", shopId);
}
