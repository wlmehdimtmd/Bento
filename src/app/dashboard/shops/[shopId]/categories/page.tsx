import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { CategoriesClient } from "@/components/product/CategoriesClient";
import type { CategoryRow } from "@/components/product/CategoryForm";
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
      ? `${t("dashboard.categories.metadataPrefix", "Categories -")} ${data.name}`
      : t("dashboard.categories.metadataFallback", "Categories"),
  };
}

export default async function CategoriesPage({ params }: { params: Params }) {
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
      <CategoriesClient
        shopId={shopId}
        initialCategories={initialCategories}
        catalogPageHeader={{
          pageTitle: t("dashboard.categories.metadataFallback", "Categories"),
          introCopy: getDashboardCatalogCopy(locale, "category"),
        }}
      />
    </div>
  );
}
