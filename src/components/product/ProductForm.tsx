"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Camera, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { useLocale } from "@/components/i18n/LocaleProvider";

// ─── Types ────────────────────────────────────────────────────
export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  option_label: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

interface CategoryOption {
  id: string;
  name: string;
  icon_emoji: string;
}

export type ProductSavePayload = {
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  option_label: string | null;
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
  subViewOverride?: "main" | "photo" | "tags";
  onSubViewChange?: (subView: "main" | "photo" | "tags") => void;
  labels: ProductLabelOption[];
}

// ─── Schema ───────────────────────────────────────────────────
const productSchema = z.object({
  category_id: z.string().min(1, "Catégorie requise"),
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  price: z
    .number()
    .positive("Le prix doit être supérieur à 0"),
  option_label: z.string().optional(),
  is_available: z.boolean(),
  display_order: z.number().int().min(0),
});

type ProductFormValues = z.infer<typeof productSchema>;

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
}: ProductFormProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const isEdit = !!initialData;

  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [subView, setSubView] = useState<"main" | "photo" | "tags">("main");

  useEffect(() => {
    if (subViewOverride && subViewOverride !== subView) {
      setSubView(subViewOverride);
    }
  }, [subView, subViewOverride]);

  function changeSubView(next: "main" | "photo" | "tags") {
    if (next === subView) return;
    setSubView(next);
    onSubViewChange?.(next);
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category_id: initialData?.category_id ?? defaultCategoryId ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? undefined,
      option_label: initialData?.option_label ?? "",
      is_available: initialData?.is_available ?? true,
      display_order: initialData?.display_order ?? nextOrder,
    },
  });

  const categoryId = watch("category_id");
  const isAvailable = watch("is_available");
  const productName = watch("name")?.trim() ?? "";

  const categorySelectItems = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c) => [c.id, `${c.icon_emoji} ${c.name}`])
      ),
    [categories]
  );

  async function onSubmit(values: ProductFormValues) {
    const payload: ProductSavePayload = {
      category_id: values.category_id,
      name: values.name,
      description: values.description || null,
      price: values.price,
      image_url: imageUrl,
      tags,
      option_label: values.option_label || null,
      is_available: values.is_available,
      display_order: values.display_order,
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

    if (isEdit) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", initialData!.id)
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success(tr("Produit mis à jour !", "Product updated!"));
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success(tr("Produit créé !", "Product created!"));
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    }
  }

  if (subView === "photo") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-4">
          {productName ? (
            <p className="mb-3 text-sm text-muted-foreground">
              {tr("Produit", "Product")} : <span className="font-medium text-foreground">{productName}</span>
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
        <div className="mt-auto border-t border-border py-3">
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
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-3">
          <TagSelector
            selected={tags}
            onChange={setTags}
            labels={labels}
            disabled={isSubmitting}
          />
        </div>
        <div className="mt-auto border-t border-border py-3">
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-5 pb-4">
      {/* Category */}
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

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">{tr("Nom", "Name")} *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Ex: Ramen tonkotsu"
          disabled={isSubmitting}
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">{tr("Description", "Description")}</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder={tr("Décrivez brièvement votre produit", "Briefly describe your product")}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {/* Price */}
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
                  alt={productName || tr("Aperçu photo produit", "Product photo preview")}
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

      {/* Option label */}
      <div className="space-y-1.5">
        <Label htmlFor="option_label">{tr("Option / Variante", "Option / Variant")}</Label>
        <Input
          id="option_label"
          {...register("option_label")}
          placeholder={tr("Ex : Cuisson ? Taille ? (vide = pas d'option)", "Ex: Doneness? Size? (leave empty if none)")}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          {tr("Laissez vide si le produit n'a pas d'option. Cette question sera posée au client au moment de la commande.", "Leave empty if the product has no option. This question will be asked at checkout.")}
        </p>
      </div>

      <Separator />

      {/* Display order + available */}
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

      {/* Actions */}
      <div
        className={`mt-auto flex w-full gap-2 border-t border-border py-3 ${
          sheetCtasFullWidth ? "" : "md:justify-end"
        }`}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={sheetCtasFullWidth ? "flex-1" : "flex-1 md:flex-none"}
        >
          {tr("Annuler", "Cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: "var(--primary)" }}
          className={sheetCtasFullWidth ? "flex-1 text-primary-foreground hover:opacity-90" : "flex-1 text-primary-foreground hover:opacity-90 md:flex-none"}
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
