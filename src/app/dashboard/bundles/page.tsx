import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { buttonVariants } from "@/components/ui/button";
import { BundlesClient } from "@/components/product/BundlesClient";
import type { BundleRow, BundleSlotData } from "@/components/product/BundleForm";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Formules" };

export default async function BundlesPage() {
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

  const { data: menuFlagRow } = await supabase
    .from("shops")
    .select("bundles_menu_grouped")
    .eq("id", shop.id)
    .maybeSingle();

  const initialBundlesMenuGrouped =
    typeof menuFlagRow?.bundles_menu_grouped === "boolean"
      ? menuFlagRow.bundles_menu_grouped
      : false;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_fr, icon_emoji")
    .eq("shop_id", shop.id)
    .order("display_order");

  const { data: bundles } = await supabase
    .from("bundles")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  const bundleIds = (bundles ?? []).map((b) => b.id);
  let slotsMap: Record<string, BundleSlotData[]> = {};

  if (bundleIds.length > 0) {
    const { data: slots } = await supabase
      .from("bundle_slots")
      .select("*")
      .in("bundle_id", bundleIds)
      .order("display_order");

    slotsMap = (slots ?? []).reduce<Record<string, BundleSlotData[]>>(
      (acc, s) => {
        if (!acc[s.bundle_id]) acc[s.bundle_id] = [];
        acc[s.bundle_id].push({
          id: s.id,
          category_id: s.category_id,
          label: s.label,
          label_fr: (s as { label_fr?: string | null }).label_fr ?? s.label,
          label_en: (s as { label_en?: string | null }).label_en ?? null,
          quantity: s.quantity,
          display_order: s.display_order,
        });
        return acc;
      },
      {}
    );
  }

  const initialBundles: BundleRow[] = (bundles ?? []).map((b) => {
    const br = b as typeof b & {
      name_fr?: string | null;
      name_en?: string | null;
      description_fr?: string | null;
      description_en?: string | null;
    };
    return {
      id: b.id,
      shop_id: b.shop_id,
      name: b.name,
      name_fr: br.name_fr ?? b.name,
      name_en: br.name_en ?? null,
      description: b.description,
      description_fr: br.description_fr ?? b.description,
      description_en: br.description_en ?? null,
      price: Number(b.price),
      image_url: b.image_url,
      is_active: b.is_active,
      created_at: b.created_at,
      slots: slotsMap[b.id] ?? [],
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      {(categories ?? []).length === 0 ? (
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {locale === "en" ? "Bundles" : "Formules"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
            {getDashboardCatalogCopy(locale, "bundle")}
          </p>
        </div>
      ) : null}

      {(categories ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {tr("Créez d'abord des catégories avant de composer des formules.", "Create categories first before composing bundles.")}
          </p>
          <Link href="/dashboard/categories" className={buttonVariants({ variant: "outline" })}>
            {tr("Gérer les catégories", "Manage categories")}
          </Link>
        </div>
      ) : (
        <BundlesClient
          shopId={shop.id}
          categories={categories ?? []}
          initialBundles={initialBundles}
          initialBundlesMenuGrouped={initialBundlesMenuGrouped}
          catalogPageHeader={{
            pageTitle: locale === "en" ? "Bundles" : "Formules",
            introCopy: getDashboardCatalogCopy(locale, "bundle"),
          }}
        />
      )}
    </div>
  );
}
