"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { mainStepIndex } from "@/lib/onboarding-flow";
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
  { id: "categories", label: "Catégories" },
  { id: "products", label: "Produits" },
  { id: "bundles", label: "Formules" },
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
  /** Sous md : aperçu replié par défaut pour libérer l’écran d’édition. */
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);

  const refresh = useCallback(() => {
    if (!isPreview) router.refresh();
  }, [isPreview, router]);

  const categoryItems = useMemo(
    () =>
      payload.categories.map((c, i) => ({
        id: c.id,
        name: c.name,
        icon_emoji: c.icon_emoji,
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
      toast.success("Import simulé (aucune donnée écrite).");
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
    if (categoryCount > 0) parts.push(`${categoryCount} catégorie${categoryCount > 1 ? "s" : ""}`);
    if (productCount > 0) parts.push(`${productCount} produit${productCount > 1 ? "s" : ""}`);
    if (bundleCount > 0) parts.push(`${bundleCount} formule${bundleCount > 1 ? "s" : ""}`);
    toast.success(
      parts.length > 0 ? `${parts.join(", ")} importé${parts.length > 1 ? "s" : ""} !` : "Import terminé !"
    );
    setPickerOpen(false);
    refresh();
  }

  const fulfillmentModes = payload.shop.fulfillment_modes ?? [];

  const previewBlock = (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 bg-muted/30 md:py-2">
        <span className="text-xs font-medium text-muted-foreground">Aperçu vitrine</span>
        <button
          type="button"
          className="md:hidden flex items-center gap-1 text-xs font-medium text-[var(--color-bento-accent)] py-1"
          onClick={() => setMobilePreviewExpanded((v) => !v)}
          aria-expanded={mobilePreviewExpanded}
        >
          {mobilePreviewExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Agrandir
            </>
          )}
        </button>
      </div>
      <div
        className={cn(
          "p-2 sm:p-4",
          "max-md:transition-[max-height] max-md:duration-300 max-md:ease-out",
          mobilePreviewExpanded
            ? "max-md:max-h-none max-md:overflow-visible"
            : "max-md:max-h-[160px] max-md:overflow-hidden"
        )}
      >
        <div className="mx-auto max-w-5xl">
          <StoreView
            shop={payload.shop}
            categories={payload.categories}
            bundles={payload.bundles}
            bundlesMenuGrouped={payload.bundlesMenuGrouped}
            reviews={payload.reviews}
            savedStorefrontLayout={payload.savedStorefrontLayout}
          />
        </div>
      </div>
    </div>
  );

  const segmentedControl = (
    <div
      className="flex rounded-xl border border-border bg-muted/30 p-1 gap-0.5"
      role="tablist"
      aria-label="Étape d’édition du catalogue"
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
            shopId={shopId}
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
    <div className="flex gap-2 items-stretch sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={() => goStep("shop")}
        className="flex-1 sm:flex-initial gap-1.5"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Button>
      <Button
        type="button"
        onClick={() => goStep("success")}
        style={{ backgroundColor: "var(--color-bento-accent)" }}
        className="flex-1 sm:flex-initial text-white hover:opacity-90 gap-1.5"
      >
        Continuer
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
              contentVariant="wide"
              contentInnerClassName="pb-28"
              footer={footer}
            >
              <div className="space-y-5 pb-4">
                <OnboardingStepTitle
                  title="Votre catalogue"
                  subtitle="Un seul défilement : aperçu à jour au fil de vos ajouts. Modèle ou saisie manuelle."
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      if (isPreview) {
                        toast.message("Simulation : import de modèles désactivé.");
                        return;
                      }
                      setPickerOpen(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Partir d&apos;un modèle
                  </Button>
                </div>

                {/* Mobile : aperçu puis édition ; desktop : grille édition + aperçu sticky (un scroll shell) */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_min(360px,38vw)] lg:items-start lg:gap-8">
                  <div className="order-2 min-w-0 lg:order-1 lg:min-h-0">{editingPanel}</div>

                  <div className="order-1 lg:order-2 lg:sticky lg:top-2 lg:self-start w-full shrink-0">
                    {previewBlock}
                  </div>
                </div>
              </div>
            </OnboardingShell>

            <CartButton />
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
