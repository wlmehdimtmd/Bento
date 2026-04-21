"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { TranslatableTabs } from "@/components/catalog/TranslatableTabs";
import {
  catalogSheetScrollClass,
  mobileCatalogDrawerScrollClass,
} from "@/components/catalog/mobileCatalogDrawerClasses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import {
  categoryCompletion,
  categoryDefaultFormValues,
  categoryFormSchema,
  categoryFormToSavePayload,
  type CategoryFormValues,
} from "@/lib/catalogFormAdapters";
import { getDefaultCatalogLanguageCode } from "@/lib/catalogLanguages";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ─── Types ────────────────────────────────────────────────────
export interface CategoryRow {
  id: string;
  shop_id: string;
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon_emoji: string;
  display_order: number;
  is_active: boolean;
  created_at: string | null;
}

export type CategorySavePayload = {
  shop_id: string;
  name: string;
  name_fr: string;
  name_en: string | null;
  description: string | null;
  description_fr: string | null;
  description_en: string | null;
  icon_emoji: string;
  is_active: boolean;
  display_order: number;
};

interface CategoryFormProps {
  shopId: string;
  nextOrder: number;
  initialData?: CategoryRow;
  onSuccess: (category: CategoryRow) => void;
  onCancel: () => void;
  onSave?: (payload: CategorySavePayload, isEdit: boolean, existingId?: string) => Promise<CategoryRow>;
  sheetCtasFullWidth?: boolean;
  subViewOverride?: "main" | "icon";
  onSubViewChange?: (subView: "main" | "icon") => void;
  /** Drawer mobile : formulaire scrollable, CTA fixes, pleine largeur utile. */
  stickyMobileActions?: boolean;
  /** Sheet desktop catalogue : même layout (header/footer fixes, corps scrollable). */
  stickySheetActions?: boolean;
}

const CATEGORY_ICONS = ["🥗","🍽️","🍰","🥤","🍕","🍔","🍜","🥩","🐟","🌮","🍣","🧁","🍷","🍺","☕","🌿","🔥","⭐"];

// ─── Component ───────────────────────────────────────────────
export function CategoryForm({
  shopId,
  nextOrder,
  initialData,
  onSuccess,
  onCancel,
  onSave,
  sheetCtasFullWidth = false,
  subViewOverride,
  onSubViewChange,
  stickyMobileActions = false,
  stickySheetActions = false,
}: CategoryFormProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const isEdit = !!initialData;
  const stickyLayout = stickyMobileActions || stickySheetActions;
  const ctasFullWidth = sheetCtasFullWidth || stickyLayout;

  const [catalogTab, setCatalogTab] = useState(getDefaultCatalogLanguageCode());
  const [subView, setSubView] = useState<"main" | "icon">("main");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: categoryDefaultFormValues(initialData),
  });

  const iconEmoji = watch("icon_emoji") || "📦";
  const isActive = watch("is_active");
  const watched = watch();
  const completionByLang = categoryCompletion(watched);
  const completeCount = Object.values(completionByLang).filter((s) => s === "complete").length;

  useEffect(() => {
    if (subViewOverride && subViewOverride !== subView) {
      setSubView(subViewOverride);
    }
  }, [subView, subViewOverride]);

  function changeSubView(next: "main" | "icon") {
    if (next === subView) return;
    setSubView(next);
    onSubViewChange?.(next);
  }

  function copyFromFr() {
    if (catalogTab === "fr") return;
    const fr = getValues("translations.fr");
    if (catalogTab === "en") {
      const enName = (getValues("translations.en.name") ?? "").trim();
      const enDesc = (getValues("translations.en.description") ?? "").trim();
      const frName = (fr?.name ?? "").trim();
      const frDesc = (fr?.description ?? "").trim();
      if (!enName && frName) {
        setValue("translations.en.name", frName, { shouldValidate: true, shouldDirty: true });
      }
      if (!enDesc && frDesc) {
        setValue("translations.en.description", frDesc, { shouldValidate: true, shouldDirty: true });
      }
    }
  }

  async function onSubmit(values: CategoryFormValues) {
    const payload: CategorySavePayload = {
      ...categoryFormToSavePayload(values, shopId, initialData?.display_order ?? nextOrder),
    };

    if (onSave) {
      try {
        const result = await onSave(payload, isEdit, initialData?.id);
        toast.success(isEdit ? tr("Catégorie mise à jour !", "Category updated!") : tr("Catégorie créée !", "Category created!"));
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tr("Erreur", "Error"));
      }
      return;
    }

    const supabase = createClient();
    const dbRow = {
      name: payload.name,
      name_fr: payload.name_fr,
      name_en: payload.name_en,
      description: payload.description,
      description_fr: payload.description_fr,
      description_en: payload.description_en,
      icon_emoji: payload.icon_emoji,
      is_active: payload.is_active,
    };

    if (isEdit) {
      const { data, error } = await supabase
        .from("categories")
        .update(dbRow)
        .eq("id", initialData!.id)
        .select()
        .single();

      if (error) { toast.error(error.message); return; }
      toast.success(tr("Catégorie mise à jour !", "Category updated!"));
      onSuccess(data as CategoryRow);
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          shop_id: shopId,
          ...dbRow,
          display_order: payload.display_order,
        })
        .select()
        .single();

      if (error) { toast.error(error.message); return; }
      toast.success(tr("Catégorie créée !", "Category created!"));
      onSuccess(data as CategoryRow);
    }
  }

  const iconScrollClass = stickyMobileActions
    ? cn(mobileCatalogDrawerScrollClass, "px-4 py-4")
    : stickySheetActions
      ? cn(catalogSheetScrollClass, "px-4 py-4")
      : "flex-1 pb-4";
  const iconFooterClass = cn(
    "border-t border-border py-3",
    stickyLayout
      ? "shrink-0 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
      : "mt-auto"
  );

  const shellClass = cn(
    "flex w-full flex-col",
    stickyLayout ? "min-h-0 flex-1" : "h-full min-h-0 flex-1"
  );

  if (subView === "icon") {
    return (
      <div className={shellClass}>
        <div className={iconScrollClass}>
          <div className="grid grid-cols-9 gap-1">
            {CATEGORY_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setValue("icon_emoji", emoji, { shouldValidate: true })}
                disabled={isSubmitting}
                className={`flex items-center justify-center h-9 w-full rounded-lg border text-xl transition-colors ${iconEmoji === emoji ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-border hover:border-muted-foreground"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className={iconFooterClass}>
          <Button
            type="button"
            onClick={() => changeSubView("main")}
            style={{ backgroundColor: "var(--primary)" }}
            className="w-full text-primary-foreground hover:opacity-90"
          >
            {tr("Valider", "Confirm")}
          </Button>
        </div>
      </div>
    );
  }

  const descLenFr = (watch("translations.fr.description") ?? "").length;
  const descLenEn = (watch("translations.en.description") ?? "").length;

  const mainScrollClass = stickyMobileActions
    ? cn(mobileCatalogDrawerScrollClass, "space-y-5 px-4 py-4")
    : stickySheetActions
      ? cn(catalogSheetScrollClass, "space-y-5 px-4 py-4")
      : "flex-1 space-y-5 pb-4";
  const mainFooterClass = cn(
    "flex w-full gap-2 border-t border-border py-3",
    stickyLayout &&
      "shrink-0 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
    !stickyLayout && "mt-auto",
    ctasFullWidth ? "" : "md:justify-end"
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={shellClass}>
      <div className={mainScrollClass}>
        <TranslatableTabs
          value={catalogTab}
          onValueChange={setCatalogTab}
          completionByLang={completionByLang}
          completeCount={completeCount}
          sectionTitle={tr("Contenu multilingue", "Multilingual content")}
          footerSlot={
            catalogTab !== "fr" ? (
              <Button type="button" variant="outline" size="sm" onClick={copyFromFr} disabled={isSubmitting}>
                {tr("Copier depuis FR (champs vides uniquement)", "Copy from FR (empty fields only)")}
              </Button>
            ) : null
          }
        >
          {(langCode) =>
            langCode === "fr" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-fr-name">{tr("Nom", "Name")} *</Label>
                  <Input
                    id="cat-fr-name"
                    {...register("translations.fr.name")}
                    placeholder={tr("Entrées, Plats, Desserts…", "Starters, Mains, Desserts...")}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {errors.translations?.fr?.name && (
                    <p className="text-xs text-destructive">{errors.translations.fr.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-fr-desc">{tr("Description", "Description")}</Label>
                  <Textarea
                    id="cat-fr-desc"
                    {...register("translations.fr.description")}
                    placeholder={tr("Description optionnelle de la catégorie…", "Optional category description...")}
                    rows={2}
                    maxLength={32}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground text-right">{descLenFr}/32</p>
                  {errors.translations?.fr?.description && (
                    <p className="text-xs text-destructive">{errors.translations.fr.description.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-en-name">{tr("Nom (anglais)", "Name (English)")}</Label>
                  <Input
                    id="cat-en-name"
                    {...register("translations.en.name")}
                    placeholder={tr("Optionnel", "Optional")}
                    disabled={isSubmitting}
                  />
                  {errors.translations?.en?.name && (
                    <p className="text-xs text-destructive">{errors.translations.en.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-en-desc">{tr("Description (anglais)", "Description (English)")}</Label>
                  <Textarea
                    id="cat-en-desc"
                    {...register("translations.en.description")}
                    placeholder={tr("Optionnel, 32 caractères max", "Optional, 32 characters max")}
                    rows={2}
                    maxLength={32}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground text-right">{descLenEn}/32</p>
                  {errors.translations?.en?.description && (
                    <p className="text-xs text-destructive">{errors.translations.en.description.message}</p>
                  )}
                </div>
              </div>
            )
          }
        </TranslatableTabs>

        <div className="space-y-1.5">
          <Label>{tr("Icône", "Icon")}</Label>
          <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => changeSubView("icon")}>
            <span className="text-lg leading-none">{iconEmoji}</span>
            <span>{tr("Choisir une icône", "Choose an icon")}</span>
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{tr("Catégorie active", "Active category")}</p>
            <p className="text-xs text-muted-foreground">
              {tr("Visible sur la vitrine publique", "Visible on storefront")}
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked, { shouldValidate: true })
            }
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className={mainFooterClass}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={ctasFullWidth ? "flex-1" : "flex-1 md:flex-none"}
        >
          {tr("Annuler", "Cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: "var(--primary)" }}
          className={ctasFullWidth ? "flex-1 text-primary-foreground hover:opacity-90" : "flex-1 text-primary-foreground hover:opacity-90 md:flex-none"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tr("Enregistrement…", "Saving...")}
            </>
          ) : isEdit ? (
            tr("Mettre à jour", "Update")
          ) : (
            tr("Créer la catégorie", "Create category")
          )}
        </Button>
      </div>
    </form>
  );
}
