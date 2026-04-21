"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2, GripVertical, X, ChevronDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/product/ImageUploader";
import { createClient } from "@/lib/supabase/client";
import {
  bundleDefaultFormValues,
  bundleFormSchema,
  bundleMainCompletion,
  bundleMainToBundlePayloadPart,
  type BundleCatalogFormValues,
} from "@/lib/catalogFormAdapters";
import { getDefaultCatalogLanguageCode } from "@/lib/catalogLanguages";
import { cn, formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ─── Types ────────────────────────────────────────────────────
export interface BundleFormProductOption {
  id: string;
  category_id: string;
  name: string;
  name_fr: string | null;
  name_en: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
}

export interface BundleSlotData {
  id?: string;
  category_id: string;
  label: string;
  label_fr?: string | null;
  label_en?: string | null;
  quantity: number;
  display_order: number;
  excluded_product_ids?: string[];
}

export interface BundleRow {
  id: string;
  shop_id: string;
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string | null;
  slots: BundleSlotData[];
}

interface CategoryOption {
  id: string;
  name: string;
  name_fr?: string | null;
  icon_emoji: string;
}

export type BundleSavePayload = {
  shop_id: string;
  name: string;
  name_fr: string;
  name_en: string | null;
  description: string | null;
  description_fr: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  slots: Array<{
    id?: string;
    category_id: string;
    label: string;
    label_fr: string;
    label_en: string | null;
    quantity: number;
    display_order: number;
    excluded_product_ids: string[];
  }>;
};

interface BundleFormProps {
  shopId: string;
  categories: CategoryOption[];
  initialData?: BundleRow;
  onSuccess: (bundle: BundleRow) => void;
  onCancel: () => void;
  onSave?: (payload: BundleSavePayload, isEdit: boolean, existingId?: string) => Promise<BundleRow>;
  subViewOverride?: "main" | "photo" | "composition";
  onSubViewChange?: (subView: "main" | "photo" | "composition") => void;
  sheetCtasFullWidth?: boolean;
  /** Drawer mobile : formulaire scrollable, CTA fixes, pleine largeur utile. */
  stickyMobileActions?: boolean;
  /** Sheet desktop catalogue : même layout (header/footer fixes, corps scrollable). */
  stickySheetActions?: boolean;
  /** Produits du shop pour ajuster les plats proposés par slot (retirer de la formule). */
  productsForBundlesForm?: BundleFormProductOption[];
}

/** Libellé FR du slot (aligné sur la catégorie catalogue). */
function categoryFrLabelForSlot(
  categoryId: string,
  categories: CategoryOption[],
  emptyLabel: string
): string {
  const c = categories.find((x) => x.id === categoryId);
  const n = (c?.name_fr?.trim() || c?.name?.trim()) ?? "";
  return n.length > 0 ? n : emptyLabel;
}

function productRowLabel(p: BundleFormProductOption, locale: string): string {
  if (locale === "en") {
    return (p.name_en?.trim() || p.name_fr?.trim() || p.name).trim();
  }
  return (p.name_fr?.trim() || p.name).trim();
}

function categoryProductIdSet(products: BundleFormProductOption[], categoryId: string): Set<string> {
  return new Set(products.filter((x) => x.category_id === categoryId).map((x) => x.id));
}

function sanitizeExcludedForCategory(
  categoryId: string,
  excluded: string[] | undefined,
  products: BundleFormProductOption[]
): string[] {
  if (!categoryId) return [];
  const allow = categoryProductIdSet(products, categoryId);
  return (excluded ?? []).filter((id) => allow.has(id));
}

// ─── Component ───────────────────────────────────────────────
export function BundleForm({
  shopId,
  categories,
  initialData,
  onSuccess,
  onCancel,
  onSave,
  subViewOverride,
  onSubViewChange,
  sheetCtasFullWidth = false,
  stickyMobileActions = false,
  stickySheetActions = false,
  productsForBundlesForm = [],
}: BundleFormProps) {
  const { locale } = useLocale();
  const stickyLayout = stickyMobileActions || stickySheetActions;
  const ctasFullWidth = sheetCtasFullWidth || stickyLayout;
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const isEdit = !!initialData;
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  const [slotCategoryValues, setSlotCategoryValues] = useState<string[]>(
    initialData?.slots.map((s) => s.category_id) ?? [""]
  );
  const [subView, setSubView] = useState<"main" | "photo" | "composition">("main");
  const [catalogTab, setCatalogTab] = useState(getDefaultCatalogLanguageCode());
  const [slotDishSectionOpen, setSlotDishSectionOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (subViewOverride && subViewOverride !== subView) {
      setSubView(subViewOverride);
    }
  }, [subView, subViewOverride]);

  function changeSubView(next: "main" | "photo" | "composition") {
    if (next === subView) return;
    setSubView(next);
    onSubViewChange?.(next);
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BundleCatalogFormValues>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: bundleDefaultFormValues(
      initialData
        ? {
            name: initialData.name,
            name_fr: initialData.name_fr,
            name_en: initialData.name_en,
            description: initialData.description,
            description_fr: initialData.description_fr,
            description_en: initialData.description_en,
            price: initialData.price,
            is_active: initialData.is_active,
            slots: initialData.slots.map((s, i) => ({
              id: s.id,
              category_id: s.category_id,
              quantity: s.quantity,
              display_order: i,
              label_en: s.label_en,
              excluded_product_ids: s.excluded_product_ids ?? [],
            })),
          }
        : undefined
    ),
  });

  const isActive = watch("is_active");
  const watchedSlots = watch("slots");
  const watched = watch();
  const completionByLang = bundleMainCompletion({
    translations: watched.translations,
    price: watched.price,
    is_active: watched.is_active,
  });
  const completeCount = Object.values(completionByLang).filter((s) => s === "complete").length;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slots",
  });

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

  function addSlot() {
    append({
      category_id: "",
      quantity: 1,
      display_order: fields.length,
      label_en: "",
      excluded_product_ids: [],
    });
    setSlotCategoryValues((prev) => [...prev, ""]);
  }

  function removeSlot(idx: number) {
    remove(idx);
    setSlotCategoryValues((prev) => prev.filter((_, i) => i !== idx));
  }

  function setSlotCategory(idx: number, val: string) {
    const prevCat = slotCategoryValues[idx];
    setSlotCategoryValues((prev) => prev.map((v, i) => (i === idx ? val : v)));
    setValue(`slots.${idx}.category_id`, val, { shouldValidate: true });
    if (prevCat && prevCat !== val) {
      setValue(`slots.${idx}.excluded_product_ids`, [], { shouldValidate: true });
      toast.info(
        tr(
          "Les réglages des plats ont été réinitialisés (nouvelle catégorie).",
          "Dish settings were reset because the category changed."
        )
      );
    }
    if (!val) {
      setValue(`slots.${idx}.excluded_product_ids`, [], { shouldValidate: true });
    }
  }

  async function onSubmit(values: BundleCatalogFormValues) {
    const emptyChoice = tr("Choix", "Choice");
    const products = productsForBundlesForm;

    for (const s of values.slots) {
      const cat = s.category_id;
      const excluded = sanitizeExcludedForCategory(cat, s.excluded_product_ids, products);
      const anyAvailableInCat = products.some((p) => p.category_id === cat && p.is_available);
      const remaining = products.filter(
        (p) => p.category_id === cat && p.is_available && !excluded.includes(p.id)
      );
      if (anyAvailableInCat && remaining.length === 0) {
        toast.error(
          tr(
            "Au moins un plat disponible doit rester proposé pour chaque choix. Vérifiez les plats retirés de la formule.",
            "At least one available dish must remain offered for each step. Check which dishes are removed from this bundle."
          )
        );
        return;
      }
    }

    const main = bundleMainToBundlePayloadPart(
      {
        translations: values.translations,
        price: values.price,
        is_active: values.is_active,
      },
      shopId,
      imageUrl
    );

    const bundlePayload: BundleSavePayload = {
      ...main,
      slots: values.slots.map((s, i) => {
        const labelFr = categoryFrLabelForSlot(s.category_id, categories, emptyChoice);
        const labelEn = s.label_en?.trim() || null;
        const excluded_product_ids = sanitizeExcludedForCategory(
          s.category_id,
          s.excluded_product_ids,
          products
        );
        return {
          id: s.id,
          category_id: s.category_id,
          label: labelFr,
          label_fr: labelFr,
          label_en: labelEn,
          quantity: s.quantity,
          display_order: i,
          excluded_product_ids,
        };
      }),
    };

    if (onSave) {
      try {
        const result = await onSave(bundlePayload, isEdit, initialData?.id);
        toast.success(isEdit ? tr("Formule mise à jour !", "Bundle updated!") : tr("Formule créée !", "Bundle created!"));
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tr("Erreur", "Error"));
      }
      return;
    }

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slots: _slots, ...dbBundlePayload } = bundlePayload;

    let bundleId: string;

    if (isEdit) {
      const { data, error } = await supabase
        .from("bundles")
        .update(dbBundlePayload)
        .eq("id", initialData!.id)
        .select("id")
        .single();
      if (error) { toast.error(error.message); return; }
      bundleId = data.id;
    } else {
      const { data, error } = await supabase
        .from("bundles")
        .insert(dbBundlePayload)
        .select("id")
        .single();
      if (error) { toast.error(error.message); return; }
      bundleId = data.id;
    }

    if (isEdit) {
      const { error } = await supabase
        .from("bundle_slots")
        .delete()
        .eq("bundle_id", bundleId);
      if (error) { toast.error(error.message); return; }
    }

    const slotsPayload = bundlePayload.slots.map((s) => ({
      bundle_id: bundleId,
      category_id: s.category_id,
      label: s.label_fr,
      label_fr: s.label_fr,
      label_en: s.label_en,
      quantity: s.quantity,
      display_order: s.display_order,
      excluded_product_ids: s.excluded_product_ids,
    }));

    const { data: savedSlots, error: slotsError } = await supabase
      .from("bundle_slots")
      .insert(slotsPayload)
      .select();

    if (slotsError) { toast.error(slotsError.message); return; }

    toast.success(isEdit ? tr("Formule mise à jour !", "Bundle updated!") : tr("Formule créée !", "Bundle created!"));

    const { data: fullBundle } = await supabase
      .from("bundles")
      .select("*")
      .eq("id", bundleId)
      .single();

    onSuccess({
      ...(fullBundle as Omit<BundleRow, "slots">),
      slots: (savedSlots ?? []).map((s) => ({
        id: s.id,
        category_id: s.category_id,
        label: s.label,
        label_fr: s.label_fr ?? s.label,
        label_en: s.label_en ?? null,
        quantity: s.quantity ?? 1,
        display_order: s.display_order ?? 0,
        excluded_product_ids: s.excluded_product_ids ?? [],
      })),
    });
  }

  const langToggle = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-xs text-muted-foreground">
        {tr("Libellés des choix (slots)", "Choice labels (slots)")}
      </span>
      <div className="inline-flex rounded-md border border-border p-0.5">
        {(["fr", "en"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setCatalogTab(code)}
            className={cn(
              "rounded px-2 py-0.5 text-xs font-semibold transition-colors",
              catalogTab === code
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  const compositionContent = (
    <div className="space-y-4">
      {langToggle}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{tr("Composition", "Composition")} *</h3>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Pour chaque étape, choisissez la catégorie : le libellé français sur la vitrine reprend le nom français de la catégorie ; les libellés anglais se saisissent en mode EN.",
              "For each step, pick a category: the French storefront label uses the category’s French name; enter English labels in EN mode."
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          disabled={isSubmitting}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {tr("Ajouter un choix", "Add choice")}
        </Button>
      </div>

      {errors.slots?.root && (
        <p className="text-xs text-destructive">{errors.slots.root.message}</p>
      )}
      {typeof errors.slots?.message === "string" && (
        <p className="text-xs text-destructive">{errors.slots.message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                {tr("Choix", "Choice")} {idx + 1}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSlot(idx)}
                disabled={isSubmitting || fields.length === 1}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>{tr("Catégorie de produits", "Product category")} *</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const active = slotCategoryValues[idx] === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSlotCategory(idx, c.id)}
                      disabled={isSubmitting}
                      className={
                        active
                          ? "rounded-full border border-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-foreground"
                          : "rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-muted-foreground"
                      }
                    >
                      {c.icon_emoji} {c.name}
                    </button>
                  );
                })}
              </div>
              {slotCategoryValues[idx] ? (
                <button
                  type="button"
                  onClick={() => setSlotCategory(idx, "")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {tr("Désélectionner la catégorie", "Unselect category")}
                </button>
              ) : null}
              {errors.slots?.[idx]?.category_id && (
                <p className="text-xs text-destructive">
                  {errors.slots[idx].category_id?.message}
                </p>
              )}
            </div>

            {slotCategoryValues[idx] ? (
              (() => {
                const catId = slotCategoryValues[idx];
                const rowProducts = productsForBundlesForm
                  .filter((p) => p.category_id === catId)
                  .sort((a, b) => a.display_order - b.display_order);
                const excluded = watchedSlots?.[idx]?.excluded_product_ids ?? [];
                const excludedCount = excluded.length;
                const expanded = slotDishSectionOpen[idx] ?? false;
                return (
                  <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        setSlotDishSectionOpen((m) => ({ ...m, [idx]: !m[idx] }))
                      }
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span className="text-sm font-medium">
                        {tr("Plats proposés pour ce choix", "Dishes offered for this step")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>
                    {expanded ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {tr(
                            "Tous les plats de la catégorie sont proposés aux clients. Retirez de la formule ceux qui ne conviennent pas (prix, carte…).",
                            "All dishes in this category are offered to customers by default. Remove from this bundle any that shouldn’t apply (price, menu rules…)."
                          )}
                        </p>
                        {rowProducts.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {tr("Aucun produit dans cette catégorie.", "No products in this category.")}
                          </p>
                        ) : (
                          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                            {rowProducts.map((product) => {
                              const offered = !excluded.includes(product.id);
                              const label = productRowLabel(product, locale);
                              return (
                                <div
                                  key={product.id}
                                  className={cn(
                                    "flex items-center justify-between gap-3 rounded-md border border-border/60 px-2 py-2",
                                    !product.is_available && "opacity-70"
                                  )}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatPrice(product.price)}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    {!product.is_available ? (
                                      <Badge variant="secondary" className="text-xs font-normal">
                                        {tr("Indisponible", "Unavailable")}
                                      </Badge>
                                    ) : (
                                      <>
                                        <span className="hidden max-w-[6.5rem] text-right text-[10px] leading-tight text-muted-foreground sm:inline">
                                          {offered
                                            ? tr("Proposé pour ce choix", "Offered for this step")
                                            : tr(
                                                "Non proposé pour cette formule",
                                                "Not offered for this bundle"
                                              )}
                                        </span>
                                        <Switch
                                          checked={offered}
                                          disabled={isSubmitting}
                                          onCheckedChange={(checked) => {
                                            const cur =
                                              getValues(`slots.${idx}.excluded_product_ids`) ?? [];
                                            if (checked) {
                                              setValue(
                                                `slots.${idx}.excluded_product_ids`,
                                                cur.filter((id) => id !== product.id),
                                                { shouldDirty: true, shouldValidate: true }
                                              );
                                            } else {
                                              setValue(
                                                `slots.${idx}.excluded_product_ids`,
                                                [...cur, product.id],
                                                { shouldDirty: true, shouldValidate: true }
                                              );
                                            }
                                          }}
                                          aria-label={tr(
                                            "Retirer de la formule",
                                            "Remove from this bundle"
                                          )}
                                        />
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {excludedCount > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {excludedCount === 1
                              ? tr("1 plat retiré de cette formule", "1 dish removed from this bundle")
                              : tr(
                                  `${excludedCount} plats retirés de cette formule`,
                                  `${excludedCount} dishes removed from this bundle`
                                )}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                );
              })()
            ) : null}

            <div className="space-y-1.5 w-32">
              <Label htmlFor={`slot-qty-${idx}`}>{tr("Quantité", "Quantity")} *</Label>
              <Input
                id={`slot-qty-${idx}`}
                type="number"
                min="1"
                step="1"
                disabled={isSubmitting}
                {...register(`slots.${idx}.quantity`, { valueAsNumber: true })}
              />
              {errors.slots?.[idx]?.quantity && (
                <p className="text-xs text-destructive">
                  {errors.slots[idx].quantity?.message}
                </p>
              )}
            </div>

            {catalogTab === "fr" ? (
              <div className="space-y-1.5 rounded-md border border-dashed border-border bg-background/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {tr("Libellé vitrine (FR)", "Storefront label (FR)")}
                </p>
                <p className="text-sm">
                  {slotCategoryValues[idx] ? (
                    <span className="font-medium text-foreground">
                      {categoryFrLabelForSlot(slotCategoryValues[idx], categories, tr("Choix", "Choice"))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{tr("Choisissez une catégorie", "Pick a category")}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tr("Passez à EN pour saisir le libellé anglais du choix.", "Switch to EN to enter the English choice label.")}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor={`slot-label-en-${idx}`} className="text-xs text-muted-foreground">
                  {tr("Libellé du choix (anglais)", "Choice label (English)")}
                </Label>
                <Input
                  id={`slot-label-en-${idx}`}
                  placeholder={tr("Optionnel", "Optional")}
                  disabled={isSubmitting}
                  {...register(`slots.${idx}.label_en`)}
                />
                {slotCategoryValues[idx] ? (
                  <p className="text-xs text-muted-foreground">
                    {tr("FR :", "FR:")}{" "}
                    <span className="font-medium text-foreground">
                      {categoryFrLabelForSlot(slotCategoryValues[idx], categories, tr("Choix", "Choice"))}
                    </span>
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const subScrollClass = stickyMobileActions
    ? cn(mobileCatalogDrawerScrollClass, "px-4 py-4")
    : stickySheetActions
      ? cn(catalogSheetScrollClass, "px-4 py-4")
      : "flex-1 pb-4";
  const subFooterClass = cn(
    "border-t border-border py-3",
    stickyLayout
      ? "shrink-0 bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
      : "mt-auto"
  );

  const shellClass = cn(
    "flex w-full flex-col",
    stickyLayout ? "min-h-0 flex-1" : "h-full min-h-0 flex-1"
  );

  if (subView === "photo") {
    return (
      <div className={shellClass}>
        <div className={subScrollClass}>
          <ImageUploader
            bucket="product-images"
            label={tr("Image de la formule", "Bundle image")}
            currentUrl={imageUrl}
            onUpload={setImageUrl}
            onRemove={() => setImageUrl(null)}
            square
          />
        </div>
        <div className={subFooterClass}>
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

  if (subView === "composition") {
    return (
      <div className={shellClass}>
        <div
          className={
            stickyMobileActions
              ? cn(mobileCatalogDrawerScrollClass, "space-y-4 px-4 py-4")
              : stickySheetActions
                ? cn(catalogSheetScrollClass, "space-y-4 px-4 py-4")
                : "flex-1 space-y-4 pb-4"
          }
        >
          {compositionContent}
        </div>
        <div className={subFooterClass}>
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

  const mainScrollClass = stickyMobileActions
    ? cn(mobileCatalogDrawerScrollClass, "space-y-6 px-4 py-4")
    : stickySheetActions
      ? cn(catalogSheetScrollClass, "space-y-6 px-4 py-4")
      : "flex-1 space-y-6 pb-4";
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
                  <Label htmlFor="bundle-fr-name">{tr("Nom de la formule", "Bundle name")} *</Label>
                  <Input
                    id="bundle-fr-name"
                    {...register("translations.fr.name")}
                    placeholder={tr("Menu Midi, Formule Découverte…", "Lunch menu, Discovery set…")}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {errors.translations?.fr?.name && (
                    <p className="text-xs text-destructive">{errors.translations.fr.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-fr-desc">{tr("Description", "Description")}</Label>
                  <Textarea
                    id="bundle-fr-desc"
                    {...register("translations.fr.description")}
                    placeholder={tr("Décrivez la formule…", "Describe the bundle…")}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-en-name">{tr("Nom (anglais)", "Name (English)")}</Label>
                  <Input
                    id="bundle-en-name"
                    {...register("translations.en.name")}
                    placeholder={tr("Optionnel", "Optional")}
                    disabled={isSubmitting}
                  />
                  {errors.translations?.en?.name && (
                    <p className="text-xs text-destructive">{errors.translations.en.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-en-desc">{tr("Description (anglais)", "Description (English)")}</Label>
                  <Textarea
                    id="bundle-en-desc"
                    {...register("translations.en.description")}
                    placeholder={tr("Optionnel", "Optional")}
                    rows={2}
                    disabled={isSubmitting}
                  />
                  {errors.translations?.en?.description && (
                    <p className="text-xs text-destructive">{errors.translations.en.description.message}</p>
                  )}
                </div>
              </div>
            )
          }
        </TranslatableTabs>

        <div className="space-y-1.5">
          <Label htmlFor="bundle-price">{tr("Prix (€)", "Price (€)")} *</Label>
          <Input
            id="bundle-price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            disabled={isSubmitting}
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{tr("Photo de la formule", "Bundle photo")}</Label>
          <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("photo")}>
            {imageUrl
              ? tr("Modifier la photo de la formule", "Edit bundle photo")
              : tr("Ajouter une photo de la formule", "Add bundle photo")}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{tr("Formule active", "Active bundle")}</p>
            <p className="text-xs text-muted-foreground">{tr("Visible sur la vitrine", "Visible on storefront")}</p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) =>
              setValue("is_active", checked, { shouldValidate: true })
            }
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-4">
          <Label>{tr("Composition du menu", "Menu composition")}</Label>
          <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("composition")}>
            {tr("Gérer la composition", "Manage composition")}
          </Button>
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
            tr("Créer la formule", "Create bundle")
          )}
        </Button>
      </div>
    </form>
  );
}
