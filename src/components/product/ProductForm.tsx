"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Camera, ChevronRight, Loader2, Plus, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "@/components/product/ImageUploader";
import { TagSelector } from "@/components/product/TagSelector";
import { createClient } from "@/lib/supabase/client";
import type { ProductLabelOption } from "@/lib/shop-labels";
import {
  productCompletion,
  productDefaultFormValues,
  productFormSchema,
  productFormToSavePayload,
  type ProductFormValues,
} from "@/lib/catalogFormAdapters";
import { getDefaultCatalogLanguageCode } from "@/lib/catalogLanguages";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ─── Types ────────────────────────────────────────────────────
export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  option_label: string | null;
  option_label_fr?: string | null;
  option_label_en?: string | null;
  option_mode?: "none" | "free" | "paid" | null;
  option_price_delta?: number | null;
  option_choices?: string[] | null;
  is_available: boolean;
  display_order: number;
  created_at: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
  icon_emoji: string;
}

export type ProductSavePayload = {
  category_id: string;
  name: string;
  name_fr: string;
  name_en: string | null;
  description: string | null;
  description_fr: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  option_label: string | null;
  option_label_fr: string | null;
  option_label_en: string | null;
  option_mode: "none" | "free" | "paid";
  option_price_delta: number;
  option_choices: string[];
  is_available: boolean;
  display_order: number;
};

interface ProductFormProps {
  categories: CategoryOption[];
  nextOrder: number;
  defaultCategoryId?: string;
  initialData?: ProductRow;
  onSuccess: (product: ProductRow) => void;
  onCancel: () => void;
  onSave?: (payload: ProductSavePayload, isEdit: boolean, existingId?: string) => Promise<ProductRow>;
  sheetCtasFullWidth?: boolean;
  subViewOverride?: "main" | "photo" | "tags" | "option";
  onSubViewChange?: (subView: "main" | "photo" | "tags" | "option") => void;
  labels: ProductLabelOption[];
  /** Drawer mobile : zone formulaire scrollable, barre d’actions fixe en bas, contenu bord à bord horizontal. */
  stickyMobileActions?: boolean;
  /** Sheet desktop catalogue : même layout (header/footer fixes, corps scrollable). */
  stickySheetActions?: boolean;
}

// ─── Component ───────────────────────────────────────────────
export function ProductForm({
  categories,
  nextOrder,
  defaultCategoryId,
  initialData,
  onSuccess,
  onCancel,
  onSave,
  sheetCtasFullWidth = false,
  subViewOverride,
  onSubViewChange,
  labels,
  stickyMobileActions = false,
  stickySheetActions = false,
}: ProductFormProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const isEdit = !!initialData;
  const stickyLayout = stickyMobileActions || stickySheetActions;
  const ctasFullWidth = sheetCtasFullWidth || stickyLayout;

  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [subView, setSubView] = useState<"main" | "photo" | "tags" | "option">("main");
  const [optionChoiceDraft, setOptionChoiceDraft] = useState("");
  const [catalogTab, setCatalogTab] = useState(getDefaultCatalogLanguageCode());

  useEffect(() => {
    if (subViewOverride && subViewOverride !== subView) {
      setSubView(subViewOverride);
    }
  }, [subView, subViewOverride]);

  function changeSubView(next: "main" | "photo" | "tags" | "option") {
    if (next === subView) return;
    setSubView(next);
    onSubViewChange?.(next);
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productDefaultFormValues(initialData, {
      defaultCategoryId,
      nextDisplayOrder: nextOrder,
    }),
  });

  const categoryId = watch("category_id");
  const watchedOptionMode = watch("option_mode");
  const optionMode: "none" | "free" | "paid" =
    watchedOptionMode === "free" || watchedOptionMode === "paid" ? watchedOptionMode : "none";
  const isAvailable = watch("is_available");
  const productNameFr = watch("translations.fr.name")?.trim() ?? "";
  const watched = watch();
  const completionByLang = productCompletion(watched);
  const completeCount = Object.values(completionByLang).filter((s) => s === "complete").length;
  const optionChoices = watch("option_choices") ?? [];

  const categorySelectItems = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c) => [c.id, `${c.icon_emoji} ${c.name}`])
      ),
    [categories]
  );

  function copyFromFr() {
    if (catalogTab === "fr") return;
    const fr = getValues("translations.fr");
    if (catalogTab === "en") {
      const enName = (getValues("translations.en.name") ?? "").trim();
      const enDesc = (getValues("translations.en.description") ?? "").trim();
      const enOpt = (getValues("translations.en.option_label") ?? "").trim();
      const frName = (fr?.name ?? "").trim();
      const frDesc = (fr?.description ?? "").trim();
      const frOpt = (fr?.option_label ?? "").trim();
      if (!enName && frName) {
        setValue("translations.en.name", frName, { shouldValidate: true, shouldDirty: true });
      }
      if (!enDesc && frDesc) {
        setValue("translations.en.description", frDesc, { shouldValidate: true, shouldDirty: true });
      }
      if (!enOpt && frOpt) {
        setValue("translations.en.option_label", frOpt, { shouldValidate: true, shouldDirty: true });
      }
    }
  }

  async function onSubmit(values: ProductFormValues) {
    const payload: ProductSavePayload = {
      ...productFormToSavePayload(values, imageUrl, tags),
    };

    if (onSave) {
      try {
        const result = await onSave(payload, isEdit, initialData?.id);
        toast.success(isEdit ? tr("Produit mis à jour !", "Product updated!") : tr("Produit créé !", "Product created!"));
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tr("Erreur", "Error"));
      }
      return;
    }

    const supabase = createClient();
    const dbRow = {
      category_id: payload.category_id,
      name: payload.name,
      name_fr: payload.name_fr,
      name_en: payload.name_en,
      description: payload.description,
      description_fr: payload.description_fr,
      description_en: payload.description_en,
      price: payload.price,
      image_url: payload.image_url,
      tags,
      option_label: payload.option_label,
      option_label_fr: payload.option_label_fr,
      option_label_en: payload.option_label_en,
      option_mode: payload.option_mode,
      option_price_delta: payload.option_price_delta,
      option_choices: payload.option_choices,
      is_available: payload.is_available,
      display_order: payload.display_order,
    };

    if (isEdit) {
      const { data, error } = await supabase
        .from("products")
        .update(dbRow)
        .eq("id", initialData!.id)
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success(tr("Produit mis à jour !", "Product updated!"));
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(dbRow)
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success(tr("Produit créé !", "Product created!"));
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    }
  }

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
          {productNameFr ? (
            <p className="mb-3 text-sm text-muted-foreground">
              {tr("Produit", "Product")} : <span className="font-medium text-foreground">{productNameFr}</span>
            </p>
          ) : null}
          <ImageUploader
            bucket="product-images"
            label={tr("Photo du produit", "Product photo")}
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

  if (subView === "tags") {
    return (
      <div className={shellClass}>
        <div
          className={
            stickyMobileActions
              ? cn(mobileCatalogDrawerScrollClass, "px-4 py-4")
              : stickySheetActions
                ? cn(catalogSheetScrollClass, "px-4 py-4")
                : "flex-1 pb-3"
          }
        >
          <TagSelector
            selected={tags}
            onChange={setTags}
            labels={labels}
            disabled={isSubmitting}
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

  function setOptionMode(val: "none" | "free" | "paid") {
    setValue("option_mode", val, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (val === "none") {
      setValue("translations.fr.option_label", "", { shouldDirty: true, shouldValidate: true });
      setValue("translations.en.option_label", "", { shouldDirty: true, shouldValidate: true });
      setValue("option_price_delta", 0, { shouldDirty: true, shouldValidate: true });
      setValue("option_choices", [], { shouldDirty: true, shouldValidate: true });
      setOptionChoiceDraft("");
    }
    if (val === "free") {
      setValue("option_price_delta", 0, { shouldDirty: true, shouldValidate: true });
    }
  }

  function addOptionChoice() {
    const next = optionChoiceDraft.trim();
    if (!next) return;
    const exists = optionChoices.some((choice) => choice.toLowerCase() === next.toLowerCase());
    if (exists) {
      setOptionChoiceDraft("");
      return;
    }
    setValue("option_choices", [...optionChoices, next], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setOptionChoiceDraft("");
  }

  function removeOptionChoice(choice: string) {
    setValue(
      "option_choices",
      optionChoices.filter((item) => item !== choice),
      { shouldDirty: true, shouldValidate: true }
    );
  }

  if (subView === "option") {
    return (
      <div className={shellClass}>
        <div className={subScrollClass}>
          <div className="space-y-3">
            <p className="text-sm font-medium">{tr("Type d'option", "Option type")}</p>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: "none", labelFr: "Sans option", labelEn: "No option" },
                { value: "free", labelFr: "Option gratuite", labelEn: "Free option" },
                { value: "paid", labelFr: "Option payante", labelEn: "Paid option" },
              ] as const).map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-lg border px-3 text-left text-sm transition-colors",
                    optionMode === mode.value
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                  onClick={() => setOptionMode(mode.value)}
                >
                  <span className="font-medium">
                    {locale === "en" ? mode.labelEn : mode.labelFr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {optionMode !== "none" && (
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prod-fr-opt">{tr("Question (FR) *", "Question (FR) *")}</Label>
                <Input
                  id="prod-fr-opt"
                  {...register("translations.fr.option_label")}
                  placeholder={tr("Ex : Cuisson ?", "Ex: Doneness?")}
                  disabled={isSubmitting}
                />
                {errors.translations?.fr?.option_label && (
                  <p className="text-xs text-destructive">{errors.translations.fr.option_label.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-en-opt">{tr("Question (EN)", "Question (EN)")}</Label>
                <Input
                  id="prod-en-opt"
                  {...register("translations.en.option_label")}
                  placeholder={tr("Optionnel", "Optional")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>{tr("Réponses proposées", "Suggested answers")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={optionChoiceDraft}
                    onChange={(e) => setOptionChoiceDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOptionChoice();
                      }
                    }}
                    placeholder={tr("Ex : Bien cuit", "Ex: Well done")}
                    disabled={isSubmitting}
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOptionChoice}
                    disabled={isSubmitting}
                    className="h-11 w-11 shrink-0 p-0"
                    aria-label={tr("Ajouter une réponse", "Add answer")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.option_choices && (
                  <p className="text-xs text-destructive">{errors.option_choices.message as string}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {optionChoices.map((choice) => (
                    <span
                      key={choice}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm"
                    >
                      {choice}
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted"
                        onClick={() => removeOptionChoice(choice)}
                        aria-label={tr("Retirer", "Remove")}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {optionMode === "paid" && (
                <div className="space-y-1.5">
                  <Label htmlFor="option_price_delta">{tr("Supplément option (€) *", "Option surcharge (€) *")}</Label>
                  <Input
                    id="option_price_delta"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                    {...register("option_price_delta", { valueAsNumber: true })}
                  />
                  {errors.option_price_delta && (
                    <p className="text-xs text-destructive">{errors.option_price_delta.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
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
        <div className="space-y-1.5">
          <Label>{tr("Catégorie", "Category")} *</Label>
          <Select
            value={categoryId}
            items={categorySelectItems}
            onValueChange={(val) => {
              if (val) setValue("category_id", val, { shouldValidate: true });
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder={tr("Choisir une catégorie…", "Choose a category...")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon_emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-xs text-destructive">{errors.category_id.message}</p>
          )}
        </div>

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
                  <Label htmlFor="prod-fr-name">{tr("Nom", "Name")} *</Label>
                  <Input
                    id="prod-fr-name"
                    {...register("translations.fr.name")}
                    placeholder="Ex: Ramen tonkotsu"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {errors.translations?.fr?.name && (
                    <p className="text-xs text-destructive">{errors.translations.fr.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-fr-desc">{tr("Description", "Description")}</Label>
                  <Textarea
                    id="prod-fr-desc"
                    {...register("translations.fr.description")}
                    placeholder={tr("Décrivez brièvement votre produit", "Briefly describe your product")}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-en-name">{tr("Nom (anglais)", "Name (English)")}</Label>
                  <Input
                    id="prod-en-name"
                    {...register("translations.en.name")}
                    placeholder={tr("Optionnel", "Optional")}
                    disabled={isSubmitting}
                  />
                  {errors.translations?.en?.name && (
                    <p className="text-xs text-destructive">{errors.translations.en.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prod-en-desc">{tr("Description (anglais)", "Description (English)")}</Label>
                  <Textarea
                    id="prod-en-desc"
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
          <Label>{tr("Options client", "Customer options")}</Label>
          <Button
            type="button"
            variant="outline"
            className="h-14 w-full justify-between rounded-xl px-3"
            onClick={() => changeSubView("option")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-md border border-border bg-muted px-2.5 text-xs font-medium">
                {optionMode === "none"
                  ? tr("Sans option", "No option")
                  : optionMode === "free"
                    ? tr("Option gratuite", "Free option")
                    : tr("Option payante", "Paid option")}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {optionMode === "none"
                  ? tr("Aucune question client", "No customer question")
                  : tr(
                      `${optionChoices.length} réponse${optionChoices.length > 1 ? "s" : ""} proposée${optionChoices.length > 1 ? "s" : ""}`,
                      `${optionChoices.length} suggested answer${optionChoices.length > 1 ? "s" : ""}`
                    )}
                {optionMode === "paid" && watched.option_price_delta > 0
                  ? ` • +${watched.option_price_delta}€`
                  : ""}
              </span>
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">{tr("Prix (€)", "Price (€)")} *</Label>
          <Input
            id="price"
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
          <Label>{tr("Photo du produit", "Product photo")}</Label>
          <Button
            type="button"
            variant="outline"
            className="h-14 w-full justify-between rounded-xl px-3"
            onClick={() => changeSubView("photo")}
          >
            <span className="flex items-center gap-2">
              <span className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-muted shrink-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={productNameFr || tr("Aperçu photo produit", "Product photo preview")}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </span>
              {imageUrl ? tr("Modifier la photo", "Edit photo") : tr("Ajouter une photo", "Add photo")}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>{tr("Allergènes et labels", "Allergens and labels")}</Label>
          <Button type="button" variant="outline" className="w-full justify-between" onClick={() => changeSubView("tags")}>
            <span>{tr("Sélectionner", "Select")}</span>
            <Badge variant="secondary">{tags.length}</Badge>
          </Button>
        </div>

        <Separator />

        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1.5 w-28">
            <Label htmlFor="display_order">{tr("Ordre", "Order")}</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              step="1"
              disabled={isSubmitting}
              {...register("display_order", { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-3 flex-1">
            <Switch
              checked={isAvailable}
              onCheckedChange={(checked) =>
                setValue("is_available", checked, { shouldValidate: true })
              }
              disabled={isSubmitting}
            />
            <div>
              <p className="text-sm font-medium">{tr("Disponible", "Available")}</p>
              <p className="text-xs text-muted-foreground">
                {tr("Visible et commandable sur la vitrine", "Visible and orderable on storefront")}
              </p>
            </div>
          </div>
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
            tr("Créer le produit", "Create product")
          )}
        </Button>
      </div>
    </form>
  );
}
