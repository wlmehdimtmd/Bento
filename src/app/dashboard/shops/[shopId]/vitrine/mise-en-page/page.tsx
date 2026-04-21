import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchShopStorefrontEditorPayload } from "@/lib/fetchShopStorefrontEditorPayload";
import { StorefrontBentoEditor } from "@/components/dashboard/StorefrontBentoEditor";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18nMessages";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
  const { shopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: t("dashboard.storefrontLayout.metadataFallback", "Storefront layout") };

  const { data } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return {
    title: data
      ? `${t("dashboard.storefrontLayout.metadataPrefix", "Layout -")} ${data.name}`
      : t("dashboard.storefrontLayout.metadataFallback", "Storefront layout"),
  };
}

export default async function ShopVitrineMiseEnPagePage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!owned) notFound();

  const payload = await fetchShopStorefrontEditorPayload(supabase, shopId);
  if (!payload) notFound();

  return (
    <div className="p-6 md:p-8">
      <StorefrontBentoEditor
        shopId={payload.shopId}
        slug={payload.shop.slug}
        shop={payload.shop}
        categories={payload.categories}
        bundles={payload.bundles}
        bundlesMenuGrouped={payload.bundlesMenuGrouped}
        storefrontPhotos={payload.storefrontPhotos}
        initialLayout={payload.storefrontBentoLayout}
        initialStorefrontThemeKey={payload.storefrontThemeKey}
        initialStorefrontThemeOverrides={payload.storefrontThemeOverrides}
      />
    </div>
  );
}
