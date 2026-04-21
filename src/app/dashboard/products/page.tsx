import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { buttonVariants } from "@/components/ui/button";
import { ProductsClient } from "@/components/product/ProductsClient";
import type { ProductRow } from "@/components/product/ProductForm";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Produits" };

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
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

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon_emoji")
    .eq("shop_id", shop.id)
    .order("display_order");

  const cats = categories ?? [];

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

  const shopLabels = await fetchShopLabelsForDashboard(supabase, shop.id);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {tr("Produits", "Products")}
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {getDashboardCatalogCopy(locale, "product")}
        </p>
      </div>

      {cats.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {tr("Créez d'abord des catégories avant d'ajouter des produits.", "Create categories first before adding products.")}
          </p>
          <Link
            href="/dashboard/categories"
            className={buttonVariants({ variant: "outline" })}
          >
            {tr("Gérer les catégories", "Manage categories")}
          </Link>
        </div>
      ) : (
        <ProductsClient
          shopId={shop.id}
          categories={cats}
          initialProducts={initialProducts}
          shopLabels={shopLabels}
        />
      )}
    </div>
  );
}
