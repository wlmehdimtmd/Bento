"use client";

import { StoreView } from "@/components/bento/StoreView";
import type { ShopInfo, CategoryInfo, BundleInfo } from "@/components/bento/StoreView";
import type { ShopReviews } from "@/lib/types";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { DemoUnifiedTopBar } from "@/components/demo/DemoUnifiedTopBar";
import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import { DEMO_PUBLIC_HEADER_BACKGROUND } from "@/lib/constants";

export interface DemoLiveStoreViewProps {
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped?: boolean;
  reviews: ShopReviews | null;
  savedStorefrontLayout: unknown | null;
  storefrontThemeKey: CategoryThemeKey;
  stripeAccountId: string | null;
}

export function DemoLiveStoreView({
  shop,
  categories,
  bundles,
  bundlesMenuGrouped = false,
  reviews,
  savedStorefrontLayout,
  storefrontThemeKey,
  stripeAccountId,
}: DemoLiveStoreViewProps) {
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
          <StorefrontThemeScope themeKey={storefrontThemeKey} className="min-h-screen">
            <div className="min-h-screen bg-background flex flex-col">
              <div
                className="sticky top-0 z-50 border-b border-white/10 text-white shadow-sm backdrop-blur-md"
                style={{ backgroundColor: DEMO_PUBLIC_HEADER_BACKGROUND }}
              >
                <DemoUnifiedTopBar />
              </div>

              <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 pb-32">
                <StoreView
                  shop={shop}
                  categories={categories}
                  bundles={bundles}
                  bundlesMenuGrouped={bundlesMenuGrouped}
                  reviews={reviews}
                  savedStorefrontLayout={savedStorefrontLayout}
                  storefrontThemeKey={storefrontThemeKey}
                />

                {categories.length === 0 && bundles.length === 0 && (
                  <div className="mt-16 text-center text-muted-foreground">
                    <p className="text-lg">Ce restaurant n&apos;a pas encore de carte.</p>
                    <p className="text-sm mt-1">Revenez bientôt !</p>
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
