import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCatalogCopy } from "@/lib/dashboard-catalog-copy";
import { buttonVariants } from "@/components/ui/button";
import { BundlesClient } from "@/components/product/BundlesClient";
import type { BundleRow, BundleSlotData } from "@/components/product/BundleForm";
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
      ? `${t("dashboard.bundles.metadataPrefix", "Bundles -")} ${data.name}`
      : t("dashboard.bundles.metadataFallback", "Bundles"),
  };
}

export default async function BundlesPage({ params }: { params: Params }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
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

  const { data: menuFlagRow } = await supabase
    .from("shops")
    .select("bundles_menu_grouped")
    .eq("id", shopId)
    .maybeSingle();

  const initialBundlesMenuGrouped =
    typeof menuFlagRow?.bundles_menu_grouped === "boolean"
      ? menuFlagRow.bundles_menu_grouped
      : false;

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon_emoji")
    .eq("shop_id", shopId)
    .order("display_order");

  // Fetch bundles
  const { data: bundles } = await supabase
    .from("bundles")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  // Fetch bundle_slots for all bundles
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
          quantity: s.quantity,
          display_order: s.display_order,
        });
        return acc;
      },
      {}
    );
  }

  const initialBundles: BundleRow[] = (bundles ?? []).map((b) => ({
    id: b.id,
    shop_id: b.shop_id,
    name: b.name,
    description: b.description,
    price: Number(b.price),
    image_url: b.image_url,
    is_active: b.is_active,
    created_at: b.created_at,
    slots: slotsMap[b.id] ?? [],
  }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {t("dashboard.bundles.metadataFallback", "Bundles")}
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
        <p className="text-sm text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          {getDashboardCatalogCopy(locale, "bundle")}
        </p>
      </div>

      {(categories ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {tr("Créez d'abord des catégories avant de composer des formules.", "Create categories first before composing bundles.")}
          </p>
          <Link
            href={`/dashboard/shops/${shopId}/categories`}
            className={buttonVariants({ variant: "outline" })}
          >
            {tr("Gérer les catégories", "Manage categories")}
          </Link>
        </div>
      ) : (
        <BundlesClient
          shopId={shopId}
          categories={categories ?? []}
          initialBundles={initialBundles}
          initialBundlesMenuGrouped={initialBundlesMenuGrouped}
        />
      )}
    </div>
  );
}
