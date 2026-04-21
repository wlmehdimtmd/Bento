import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopForm } from "@/components/shop/ShopForm";
import type { SocialLinks } from "@/lib/types";
import { storefrontPublicUrl } from "@/lib/publicAppUrl";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { cookies } from "next/headers";
import { MESSAGES } from "@/lib/i18nMessages";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return { title: MESSAGES[locale]["dashboard.shopSettings.metadataTitle"] };
}

export default async function ShopSettingsPage({ params }: { params: Params }) {
  const { shopId } = await params;
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) notFound();

  const storeUrl = storefrontPublicUrl(shop.slug);

  const socialLinks: SocialLinks =
    typeof shop.social_links === "object" && shop.social_links !== null
      ? (shop.social_links as SocialLinks)
      : {};

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  return (
    <div className="max-w-3xl space-y-8 p-6 md:p-8">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-onest)" }}
      >
        {t("dashboard.shopSettings.titlePrefix", "Storefront settings -")} {shop.name}
      </h1>

      <ShopForm
        key={shop.id}
        userId={user.id}
        vitrineTabbed
        shopId={shopId}
        storeUrl={storeUrl}
        initialData={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          type: shop.type,
          description: shop.description,
          address: shop.address,
          phone: shop.phone,
          email_contact: shop.email_contact,
          logo_url: shop.logo_url,
          cover_image_url: shop.cover_image_url,
          social_links: socialLinks,
          fulfillment_modes: fulfillmentModes,
          opening_hours: shop.opening_hours,
          opening_timezone: shop.opening_timezone,
          open_on_public_holidays: shop.open_on_public_holidays,
        }}
      />
    </div>
  );
}
