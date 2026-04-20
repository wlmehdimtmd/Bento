import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_PAGE_DESCRIPTION } from "@/lib/dashboard-catalog-copy";
import { CategoriesClient } from "@/components/product/CategoriesClient";
import type { CategoryRow } from "@/components/product/CategoryForm";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .single();
  return { title: data ? `Catégories — ${data.name}` : "Catégories" };
}

export default async function CategoriesPage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify shop ownership
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) notFound();

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("shop_id", shopId)
    .order("display_order", { ascending: true });

  // Fetch product counts per category
  const catIds = (categories ?? []).map((c) => c.id);
  let productCountMap: Record<string, number> = {};

  if (catIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("category_id")
      .in("category_id", catIds);

    productCountMap = (products ?? []).reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.category_id] = (acc[p.category_id] ?? 0) + 1;
        return acc;
      },
      {}
    );
  }

  const initialCategories = (categories ?? []).map((c) => ({
    ...(c as CategoryRow),
    productCount: productCountMap[c.id] ?? 0,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Catégories
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {CATEGORY_PAGE_DESCRIPTION}
        </p>
      </div>

      {/* Client-side list with all interactions */}
      <CategoriesClient
        shopId={shopId}
        initialCategories={initialCategories}
      />
    </div>
  );
}
