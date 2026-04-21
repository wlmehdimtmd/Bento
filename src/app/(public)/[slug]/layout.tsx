import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import {
  coerceStorefrontThemeKey,
  coerceStorefrontThemeOverrides,
} from "@/lib/storefrontTheme";

export default async function ShopPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, stripe_account_id, fulfillment_modes, storefront_theme_key, storefront_theme_overrides"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (process.env.NODE_ENV === "development" && shopError) {
    console.error(
      `[public shop layout] slug=${slug} code=${shopError.code} message=${shopError.message}` +
        (shopError.details ? ` details=${shopError.details}` : "")
    );
  }

  if (!shop) notFound();

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  const storefrontThemeKey = coerceStorefrontThemeKey(shop.storefront_theme_key);
  const storefrontThemeOverrides = coerceStorefrontThemeOverrides(
    shop.storefront_theme_overrides
  );

  return (
    <CartProvider shopSlug={shop.slug}>
      <PublicShopProvider
        shop={{
          id: shop.id,
          slug: shop.slug,
          name: shop.name,
          stripeAccountId: shop.stripe_account_id,
          fulfillmentModes,
        }}
      >
        <CartDrawerProvider>
          <StorefrontThemeScope
            themeKey={storefrontThemeKey}
            themeOverrides={storefrontThemeOverrides}
            className="min-h-screen"
          >
            <div className="flex min-h-screen flex-col">
              <PublicHeader
                shopName={shop.name}
                shopLogo={shop.logo_url}
                shopSlug={shop.slug}
              />
              <main id="main-content" className="flex-1 pb-32">
                {children}
              </main>
            </div>
            <CartButton />
            <CartDrawer />
          </StorefrontThemeScope>
        </CartDrawerProvider>
      </PublicShopProvider>
    </CartProvider>
  );
}
