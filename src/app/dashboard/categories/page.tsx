import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { CategoriesClient } from "@/components/product/CategoriesClient";
import type { CategoryRow } from "@/components/product/CategoryForm";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Catégories" };

export default async function CategoriesPage() {
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
    .select("*")
    .eq("shop_id", shop.id)
    .order("display_order", { ascending: true });

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
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {tr("Catégories", "Categories")}
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {getDashboardCatalogCopy(locale, "category")}
        </p>
      </div>

      <CategoriesClient shopId={shop.id} initialCategories={initialCategories} />
    </div>
  );
}
