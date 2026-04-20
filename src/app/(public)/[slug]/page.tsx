import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreView } from "@/components/bento/StoreView";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import { fetchPublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ order?: string; id?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const payload = await fetchPublicShopPagePayload(supabase, { slug });

  if (!payload) return { title: "Vitrine introuvable" };

  const { shop } = payload;
  const imageUrl = shop.cover_image_url ?? shop.logo_url;
  const description =
    shop.description ?? `Découvrez la carte de ${shop.name} et commandez en ligne.`;

  return {
    title: shop.name,
    description,
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

  const payload = await fetchPublicShopPagePayload(supabase, { slug });

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
    <StorefrontThemeScope
      themeKey={storefrontThemeKey}
      themeOverrides={storefrontThemeOverrides}
      className="min-h-screen"
    >
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
            <p className="text-lg">Ce restaurant n&apos;a pas encore de carte.</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        )}
      </div>
    </StorefrontThemeScope>
  );
}
