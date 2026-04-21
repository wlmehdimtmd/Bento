"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { TemplatePickerDialog, importTemplatesIntoShop, type ImportData } from "@/components/templates/TemplatePickerDialog";
import { createClient } from "@/lib/supabase/client";
import { mainStepIndex } from "@/lib/onboarding-flow";
import {
  useOnboardingRuntime,
  useOnboardingStepNav,
} from "@/components/onboarding/OnboardingRuntimeContext";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface Props {
  shopId: string;
  existingCategories: { id: string; name: string }[];
}

export function OnboardingTemplatesStep({ shopId, existingCategories }: Props) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const { mode } = useOnboardingRuntime();
  const isPreview = mode === "preview";
  const goStep = useOnboardingStepNav(shopId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imported, setImported] = useState(false);

  async function handleImport(data: ImportData) {
    if (isPreview) {
      toast.success(tr("Import simulé (aucune donnée écrite).", "Simulated import (no data written)."));
      setImported(true);
      setPickerOpen(false);
      return;
    }
    const supabase = createClient();
    const { categoryCount, productCount, bundleCount } = await importTemplatesIntoShop(
      supabase,
      shopId,
      data,
      existingCategories
    );

    const parts: string[] = [];
    if (categoryCount > 0) parts.push(locale === "en" ? `${categoryCount} categor${categoryCount > 1 ? "ies" : "y"}` : `${categoryCount} catégorie${categoryCount > 1 ? "s" : ""}`);
    if (productCount > 0) parts.push(locale === "en" ? `${productCount} product${productCount > 1 ? "s" : ""}` : `${productCount} produit${productCount > 1 ? "s" : ""}`);
    if (bundleCount > 0) parts.push(locale === "en" ? `${bundleCount} bundle${bundleCount > 1 ? "s" : ""}` : `${bundleCount} formule${bundleCount > 1 ? "s" : ""}`);

    toast.success(
      parts.length > 0
        ? locale === "en"
          ? `${parts.join(", ")} imported!`
          : `${parts.join(", ")} importé${parts.length > 1 ? "s" : ""} !`
        : tr("Import terminé !", "Import completed!")
    );
    setImported(true);
    setPickerOpen(false);
  }

  function goNext() {
    goStep("success");
  }

  const footer = (
    <div className="flex items-center justify-between">
      <button
        onClick={goNext}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {tr("Passer cette étape", "Skip this step")}
      </button>
      <Button
        onClick={goNext}
        style={{ backgroundColor: "var(--primary)" }}
        className="text-primary-foreground hover:opacity-90 gap-1.5"
      >
        {imported ? tr("Continuer", "Continue") : tr("Passer", "Skip")}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <>
      <OnboardingShell
        currentStep={mainStepIndex("catalog")}
        footer={footer}
        backAction={() => goStep("catalog")}
      >
        <div className="pt-6 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              {tr("Gagnez du temps !", "Save time!")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {tr("Importez des produits depuis nos modèles pré-remplis. Vous pourrez tout modifier ensuite.", "Import products from our pre-filled templates. You can edit everything afterward.")}
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center gap-4 text-center">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: "var(--primary)", opacity: 0.9 }}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="font-semibold">{tr("Catalogue de modèles", "Template catalog")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tr("Restaurant, Fleuriste, Boulangerie, Pizzeria et plus — choisissez les produits qui vous ressemblent.", "Restaurant, florist, bakery, pizzeria, and more — choose products that match your business.")}
              </p>
            </div>
            {isPreview ? (
              <p className="text-xs text-muted-foreground">
                {tr("L'import de modèles est désactivé en simulation (Supabase requis).", "Template import is disabled in preview mode (Supabase required).")}
              </p>
            ) : (
              <Button
                onClick={() => setPickerOpen(true)}
                style={{ backgroundColor: "var(--primary)" }}
                className="text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                {imported ? tr("Importer encore", "Import more") : tr("Choisir des modèles", "Choose templates")}
              </Button>
            )}
          </div>

          {imported && (
            <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
              {tr("✓ Import réussi ! Vous pourrez modifier votre catalogue depuis le tableau de bord.", "✓ Import successful! You can edit your catalog from the dashboard.")}
            </p>
          )}
        </div>
      </OnboardingShell>

      {!isPreview && (
        <TemplatePickerDialog
          mode="full"
          shopCategories={existingCategories}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onImport={handleImport}
        />
      )}
    </>
  );
}
