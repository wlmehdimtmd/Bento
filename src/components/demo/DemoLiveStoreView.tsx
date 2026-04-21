"use client";

import { StoreView } from "@/components/bento/StoreView";
import type { ShopInfo, CategoryInfo, BundleInfo } from "@/components/bento/StoreView";
import type { ShopReviews, StorefrontPhoto } from "@/lib/types";
import type { StorefrontThemeOverrides } from "@/lib/storefrontTheme";
import type { ProductLabelOption } from "@/lib/shop-labels";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { DemoUnifiedTopBar } from "@/components/demo/DemoUnifiedTopBar";
import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface DemoLiveStoreViewProps {
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped?: boolean;
  reviews: ShopReviews | null;
  storefrontPhotos: StorefrontPhoto[];
  savedStorefrontLayout: unknown | null;
  storefrontThemeKey: CategoryThemeKey;
  storefrontThemeOverrides: StorefrontThemeOverrides;
  shopLabels: ProductLabelOption[];
  stripeAccountId: string | null;
}

export function DemoLiveStoreView({
  shop,
  categories,
  bundles,
  bundlesMenuGrouped = false,
  reviews,
  storefrontPhotos,
  savedStorefrontLayout,
  storefrontThemeKey,
  storefrontThemeOverrides,
  shopLabels,
  stripeAccountId,
}: DemoLiveStoreViewProps) {
  const { locale } = useLocale();
  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? shop.fulfillment_modes
    : [];

  return (
    <CartProvider shopSlug="demo">
      <PublicShopProvider
        shop={{
          id: shop.id,
          slug: shop.slug,
          name: shop.name,
          stripeAccountId,
          fulfillmentModes: fulfillmentModes,
          isDemoMode: true,
        }}
      >
        <CartDrawerProvider>
          <StorefrontThemeScope
            themeKey={storefrontThemeKey}
            themeOverrides={storefrontThemeOverrides}
            className="min-h-screen"
          >
            <div className="flex min-h-screen flex-col bg-transparent">
              <div className="sticky top-0 z-50 bg-transparent p-[4px]">
                <DemoUnifiedTopBar />
              </div>

              <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 pb-32">
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
                      {locale === "en" ? "This shop does not have a menu yet." : "Ce restaurant n&apos;a pas encore de carte."}
                    </p>
                    <p className="text-sm mt-1">{locale === "en" ? "Please check back soon!" : "Revenez bientôt !"}</p>
                  </div>
                )}
              </main>
            </div>
          </StorefrontThemeScope>

          <CartButton />
          <CartDrawer />
        </CartDrawerProvider>
      </PublicShopProvider>
    </CartProvider>
  );
}
