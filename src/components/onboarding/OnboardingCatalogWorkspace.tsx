"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BENTO_TILE_ELEVATION_SHADOW_CLASS } from "@/components/bento/bentoGridConstants";
import { StoreView } from "@/components/bento/StoreView";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { OnboardingCategoriesStep } from "@/components/onboarding/OnboardingCategoriesStep";
import { OnboardingProductsStep } from "@/components/onboarding/OnboardingProductsStep";
import { OnboardingBundlesStep } from "@/components/onboarding/OnboardingBundlesStep";
import {
  TemplatePickerDialog,
  importTemplatesIntoShop,
  type ImportData,
} from "@/components/templates/TemplatePickerDialog";
import { createClient } from "@/lib/supabase/client";
import { buildOnboardingPath, mainStepIndex } from "@/lib/onboarding-flow";
import type { PublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import {
  useOnboardingRuntime,
  useOnboardingStepNav,
} from "@/components/onboarding/OnboardingRuntimeContext";

export type OnboardingProductRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  is_available: boolean;
  display_order: number;
};

type EditingSection = "categories" | "products" | "bundles";

interface OnboardingCatalogWorkspaceProps {
  shopId: string;
  payload: PublicShopPagePayload;
  initialProducts: OnboardingProductRow[];
}

const SECTIONS: { id: EditingSection; label: string }[] = [
  { id: "categories", label: "Categories" },
  { id: "products", label: "Products" },
  { id: "bundles", label: "Bundles" },
];

export function OnboardingCatalogWorkspace({
  shopId,
  payload,
  initialProducts,
}: OnboardingCatalogWorkspaceProps) {
  const router = useRouter();
  const { mode } = useOnboardingRuntime();
  const isPreview = mode === "preview";
  const goStep = useOnboardingStepNav(shopId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EditingSection>("categories");

  const refresh = useCallback(() => {
    if (!isPreview) router.refresh();
  }, [isPreview, router]);

  const categoryItems = useMemo(
    () =>
      payload.categories.map((c, i) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon_emoji: c.icon_emoji,
        is_active: true,
        display_order: i,
      })),
    [payload.categories]
  );

  const categoryTabs = useMemo(
    () =>
      payload.categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon_emoji: c.icon_emoji,
      })),
    [payload.categories]
  );

  const bundleItems = useMemo(
    () =>
      payload.bundles.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        price: b.price,
      })),
    [payload.bundles]
  );

  const templateCategoryNames = useMemo(
    () => payload.categories.map((c) => ({ id: c.id, name: c.name })),
    [payload.categories]
  );

  async function handleTemplateImport(data: ImportData) {
    if (isPreview) {
      toast.success("Simulated import (no data written).");
      setPickerOpen(false);
      return;
    }
    const supabase = createClient();
    const { categoryCount, productCount, bundleCount } = await importTemplatesIntoShop(
      supabase,
      shopId,
      data,
      templateCategoryNames
    );
    const parts: string[] = [];
    if (categoryCount > 0) parts.push(`${categoryCount} categor${categoryCount > 1 ? "ies" : "y"}`);
    if (productCount > 0) parts.push(`${productCount} product${productCount > 1 ? "s" : ""}`);
    if (bundleCount > 0) parts.push(`${bundleCount} bundle${bundleCount > 1 ? "s" : ""}`);
    toast.success(
      parts.length > 0 ? `Imported: ${parts.join(", ")}.` : "Import complete."
    );
    setPickerOpen(false);
    refresh();
  }

  const fulfillmentModes = payload.shop.fulfillment_modes ?? [];

  function goBackToServiceMode() {
    if (isPreview) {
      goStep("shop");
      return;
    }
    router.push(`${buildOnboardingPath("shop", shopId)}&subStep=4`);
  }

  const previewBlock = (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-background",
        BENTO_TILE_ELEVATION_SHADOW_CLASS
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Storefront preview</span>
      </div>
      <div className="p-2 sm:p-4">
        <div className="mx-auto max-w-5xl">
          <StoreView
            shop={payload.shop}
            categories={payload.categories}
            bundles={payload.bundles}
            bundlesMenuGrouped={payload.bundlesMenuGrouped}
            storefrontPhotos={payload.storefrontPhotos}
            savedStorefrontLayout={payload.savedStorefrontLayout}
            storefrontThemeKey={payload.storefrontThemeKey}
            storefrontThemeOverrides={payload.storefrontThemeOverrides}
            shopLabels={payload.shopLabels}
          />
        </div>
      </div>
    </div>
  );

  const segmentedControl = (
    <div
      className="flex rounded-xl border border-border bg-muted/30 p-1 gap-0.5"
      role="tablist"
      aria-label="Catalog editing step"
    >
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          id={`tab-${id}`}
          type="button"
          role="tab"
          aria-selected={editingSection === id}
          className={cn(
            "flex-1 min-w-0 rounded-lg px-2 py-2 text-xs sm:text-sm font-medium transition-colors",
            editingSection === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setEditingSection(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const editingPanel = (
    <div className="min-w-0 space-y-5">
      {segmentedControl}
      <div role="tabpanel" id={`panel-${editingSection}`} aria-labelledby={`tab-${editingSection}`}>
        {editingSection === "categories" && (
          <OnboardingCategoriesStep
            shopId={shopId}
            initialCategories={categoryItems}
            isPreview={isPreview}
            onCatalogChanged={refresh}
          />
        )}
        {editingSection === "products" && (
          <OnboardingProductsStep
            categories={categoryTabs}
            initialProducts={initialProducts}
            isPreview={isPreview}
            onCatalogChanged={refresh}
          />
        )}
        {editingSection === "bundles" && (
          <OnboardingBundlesStep
            shopId={shopId}
            categories={categoryTabs}
            initialBundles={bundleItems}
            isPreview={isPreview}
            onCatalogChanged={refresh}
          />
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="mx-auto flex w-full max-w-[416px] gap-2 items-stretch sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={goBackToServiceMode}
        className="flex-1 sm:flex-initial gap-1.5"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <Button
        type="button"
        onClick={() => goStep("success")}
        style={{ backgroundColor: "var(--primary)" }}
        className="flex-1 sm:flex-initial text-primary-foreground hover:opacity-90 gap-1.5"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <CartProvider shopSlug={payload.shop.slug}>
        <PublicShopProvider
          shop={{
            id: payload.shop.id,
            slug: payload.shop.slug,
            name: payload.shop.name,
            stripeAccountId: payload.stripeAccountId,
            fulfillmentModes,
            ...(isPreview ? { isDemoMode: true } : {}),
          }}
        >
          <CartDrawerProvider>
            <OnboardingShell
              currentStep={mainStepIndex("catalog")}
              subSteps={{ total: 5, current: 5 }}
              contentVariant="wide"
              footerContentVariant="narrow"
              contentInnerClassName="pb-28"
              footer={footer}
            >
              <div className="space-y-5 pt-2 pb-4">
                <div className="mx-auto w-full max-w-[416px]">
                  <OnboardingStepTitle
                    title="Your catalog"
                    subtitle="One continuous flow: live preview as you add items. Start from a template or enter manually."
                  />
                </div>

                <div className="mx-auto flex w-full max-w-[416px] flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      if (isPreview) {
                        toast.message("Simulation: template import disabled.");
                        return;
                      }
                      setPickerOpen(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Start from a template
                  </Button>
                </div>

                <div className="mx-auto w-full max-w-[416px] min-w-0 lg:hidden">{editingPanel}</div>

                <div className="hidden lg:grid lg:grid-cols-[416px_minmax(0,1fr)] lg:items-start lg:gap-8">
                  <div className="w-full max-w-[416px] min-w-0">{editingPanel}</div>
                  <div className="lg:sticky lg:top-2 lg:self-start w-full shrink-0">
                    {previewBlock}
                  </div>
                </div>
              </div>
            </OnboardingShell>

            <CartButton showLocaleSwitcher={false} />
            <CartDrawer />
          </CartDrawerProvider>
        </PublicShopProvider>
      </CartProvider>

      {!isPreview && (
        <TemplatePickerDialog
          mode="full"
          shopCategories={templateCategoryNames}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onImport={handleTemplateImport}
        />
      )}
    </>
  );
}
