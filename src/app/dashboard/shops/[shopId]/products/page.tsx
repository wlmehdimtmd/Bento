import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_PAGE_DESCRIPTION } from "@/lib/dashboard-catalog-copy";
import { buttonVariants } from "@/components/ui/button";
import { ProductsClient } from "@/components/product/ProductsClient";
import type { ProductRow } from "@/components/product/ProductForm";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .single();
  return { title: data ? `Produits — ${data.name}` : "Produits" };
}

export default async function ProductsPage({ params }: { params: Params }) {
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

  // Fetch categories for this shop
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon_emoji")
    .eq("shop_id", shopId)
    .order("display_order");

  const cats = categories ?? [];

  // Fetch products (only for categories in this shop)
  let initialProducts: (ProductRow & { categoryName: string })[] = [];

  if (cats.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .in("category_id", cats.map((c) => c.id))
      .order("display_order");

    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    initialProducts = (products ?? []).map((p) => ({
      ...(p as ProductRow),
      tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
      categoryName: catMap[p.category_id]?.name ?? "—",
    }));
  }

  const shopLabels = await fetchShopLabelsForDashboard(supabase, shopId);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Produits
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {PRODUCT_PAGE_DESCRIPTION}
        </p>
      </div>

      {cats.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Créez d&apos;abord des catégories avant d&apos;ajouter des produits.
          </p>
          <Link
            href={`/dashboard/shops/${shopId}/categories`}
            className={buttonVariants({ variant: "outline" })}
          >
            Gérer les catégories
          </Link>
        </div>
      ) : (
        <ProductsClient
          shopId={shopId}
          categories={cats}
          initialProducts={initialProducts}
          shopLabels={shopLabels}
        />
      )}
    </div>
  );
}
