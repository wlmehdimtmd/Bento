import { notFound, redirect } from "next/navigation";

import { ShopLabelsClient } from "@/components/product/ShopLabelsClient";
import { createClient } from "@/lib/supabase/server";
import { LABEL_PAGE_DESCRIPTION } from "@/lib/dashboard-catalog-copy";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("name").eq("id", shopId).single();
  return { title: data ? `Labels — ${data.name}` : "Labels" };
}

export default async function ShopLabelsPage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();
  if (!shop) notFound();

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
          {LABEL_PAGE_DESCRIPTION}
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
