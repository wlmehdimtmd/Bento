import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { buttonVariants } from "@/components/ui/button";
import { ProductsClient } from "@/components/product/ProductsClient";
import type { ProductRow } from "@/components/product/ProductForm";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18nMessages";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
  const { shopId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .single();
  return {
    title: data
      ? `${t("dashboard.products.metadataPrefix", "Products -")} ${data.name}`
      : t("dashboard.products.metadataFallback", "Products"),
  };
}

export default async function ProductsPage({ params }: { params: Params }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
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
  const categoriesForClient = cats.map((c) => ({
    id: c.id,
    name: c.name,
    icon_emoji: c.icon_emoji ?? "",
  }));

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
      option_mode:
        p.option_mode === "free" || p.option_mode === "paid" ? p.option_mode : "none",
      option_price_delta: Number(p.option_price_delta ?? 0),
      option_choices: Array.isArray(p.option_choices) ? (p.option_choices as string[]) : [],
      is_available: p.is_available ?? true,
      display_order: p.display_order ?? 0,
      created_at: p.created_at ?? null,
      categoryName: catMap[p.category_id]?.name ?? "—",
    }));
  }

  const shopLabels = await fetchShopLabelsForDashboard(supabase, shopId);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {cats.length === 0 ? (
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {t("dashboard.products.metadataFallback", "Products")}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
            {getDashboardCatalogCopy(locale, "product")}
          </p>
        </div>
      ) : null}

      {cats.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {locale === "en"
              ? "Create categories first before adding products."
              : "Créez d'abord des catégories avant d'ajouter des produits."}
          </p>
          <Link
            href={`/dashboard/shops/${shopId}/categories`}
            className={buttonVariants({ variant: "outline" })}
          >
            {locale === "en" ? "Manage categories" : "Gérer les catégories"}
          </Link>
        </div>
      ) : (
        <ProductsClient
          shopId={shopId}
          categories={categoriesForClient}
          initialProducts={initialProducts}
          shopLabels={shopLabels}
          catalogPageHeader={{
            pageTitle: t("dashboard.products.metadataFallback", "Products"),
            introCopy: getDashboardCatalogCopy(locale, "product"),
          }}
        />
      )}
    </div>
  );
}
