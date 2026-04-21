import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { StoreView } from "@/components/bento/StoreView";
import { fetchPublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { InactivePublicStorefront } from "@/components/storefront/InactivePublicStorefront";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { resolvePublicShopSlug } from "@/lib/resolvePublicShopSlug";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ order?: string; id?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const { slug } = await params;
  const resolved = await resolvePublicShopSlug(slug);

  if (resolved.status === "not_found") {
    return { title: locale === "en" ? "Storefront not found" : "Vitrine introuvable" };
  }

  if (resolved.status === "inactive_public") {
    const title =
      locale === "en"
        ? `${resolved.name} — storefront not published`
        : `${resolved.name} — vitrine non publique`;
    return {
      title,
      description:
        locale === "en"
          ? "This shop is not visible to the public yet."
          : "Cette boutique n'est pas encore visible publiquement.",
      robots: { index: false, follow: false },
    };
  }

  const supabase = await createClient();
  const payload = await fetchPublicShopPagePayload(supabase, { slug }, locale);

  if (!payload) return { title: locale === "en" ? "Storefront not found" : "Vitrine introuvable" };

  const { shop } = payload;
  const imageUrl = shop.cover_image_url ?? shop.logo_url;
  const description =
    shop.description ??
    (locale === "en"
      ? `Discover ${shop.name}'s menu and order online.`
      : `Découvrez la carte de ${shop.name} et commandez en ligne.`);

  return {
    title: shop.name,
    description,
    alternates: {
      canonical: `/${slug}`,
      languages: {
        fr: `/${slug}?lang=fr`,
        en: `/${slug}?lang=en`,
      },
    },
    openGraph: {
      title: shop.name,
      description,
      type: "website",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: shop.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: shop.name,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const { slug } = await params;
  const { order: orderStatus, id: orderId } = await searchParams;
  const supabase = await createClient();

  if (orderStatus === "success" && orderId) {
    const { data: orderData } = await supabase
      .from("orders")
      .select(
        "id, order_number, total_amount, fulfillment_mode, customer_name, table_number, delivery_address"
      )
      .eq("id", orderId)
      .single();

    if (orderData) {
      return <OrderConfirmation order={orderData} shopSlug={slug} />;
    }
  }

  const resolved = await resolvePublicShopSlug(slug);

  if (resolved.status === "inactive_public") {
    return <InactivePublicStorefront shopName={resolved.name} locale={locale} />;
  }

  if (resolved.status === "not_found") {
    notFound();
  }

  const payload = await fetchPublicShopPagePayload(supabase, { slug }, locale);

  if (!payload) notFound();

  const {
    shop,
    categories,
    bundles,
    bundlesMenuGrouped,
    reviews,
    storefrontPhotos,
    savedStorefrontLayout,
    storefrontThemeKey,
    storefrontThemeOverrides,
    shopLabels,
  } = payload;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <StoreView
        shop={shop}
        categories={categories}
        bundles={bundles}
        bundlesMenuGrouped={bundlesMenuGrouped}
        reviews={reviews}
        storefrontPhotos={storefrontPhotos}
        savedStorefrontLayout={savedStorefrontLayout}
        storefrontThemeKey={storefrontThemeKey}
        storefrontThemeOverrides={storefrontThemeOverrides}
        shopLabels={shopLabels}
      />

      {categories.length === 0 && bundles.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-lg">
            {locale === "en"
              ? "This shop does not have a menu yet."
              : "Ce restaurant n&apos;a pas encore de carte."}
          </p>
          <p className="text-sm mt-1">{locale === "en" ? "Please check back soon!" : "Revenez bientôt !"}</p>
        </div>
      )}
    </div>
  );
}
