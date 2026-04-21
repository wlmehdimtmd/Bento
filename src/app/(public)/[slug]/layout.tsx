import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import { publicShopThemeFromRow, resolvePublicShopSlug } from "@/lib/resolvePublicShopSlug";

export default async function ShopPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolvePublicShopSlug(slug);

  if (resolved.status === "not_found") {
    notFound();
  }

  if (resolved.status === "inactive_public") {
    const { storefrontThemeKey, storefrontThemeOverrides } = publicShopThemeFromRow({
      id: "",
      name: resolved.name,
      slug: resolved.slug,
      logo_url: null,
      stripe_account_id: null,
      fulfillment_modes: [],
      storefront_theme_key: null,
      storefront_theme_overrides: null,
      is_active: false,
    });

    return (
      <StorefrontThemeScope
        themeKey={storefrontThemeKey}
        themeOverrides={storefrontThemeOverrides}
        className="min-h-screen"
      >
        <div className="flex min-h-screen flex-col">
          <PublicHeader shopName={resolved.name} shopLogo={null} shopSlug={resolved.slug} />
          <main id="main-content" className="flex-1 pb-32">
            {children}
          </main>
        </div>
      </StorefrontThemeScope>
    );
  }

  const shop = resolved.shop;

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  const { storefrontThemeKey, storefrontThemeOverrides } = publicShopThemeFromRow(shop);

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
