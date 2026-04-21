import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ShopLabelsClient } from "@/components/product/ShopLabelsClient";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Labels" };

export default async function LabelsPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!shop) redirect("/dashboard");

  const initialLabels = await fetchShopLabelsForDashboard(supabase, shop.id);
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .eq("shop_id", shop.id);

  const categoryIds = (categories ?? []).map((c) => c.id);
  let existingProductTags: string[] = [];

  if (categoryIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("tags")
      .in("category_id", categoryIds);

    const tagSet = new Set<string>();
    for (const row of products ?? []) {
      const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
      for (const tag of tags) {
        const normalized = typeof tag === "string" ? tag.trim() : "";
        if (normalized) tagSet.add(normalized);
      }
    }
    existingProductTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b, "fr"));
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
          Labels
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {getDashboardCatalogCopy(locale, "label")}
        </p>
      </div>

      <ShopLabelsClient
        shopId={shop.id}
        initialLabels={initialLabels}
        existingProductTags={existingProductTags}
      />
    </div>
  );
}
