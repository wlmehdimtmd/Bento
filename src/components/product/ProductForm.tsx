"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
}: ProductFormProps) {
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
        toast.success(isEdit ? "Produit mis à jour !" : "Produit créé !");
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
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
      toast.success("Produit mis à jour !");
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      toast.success("Produit créé !");
      onSuccess({ ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow);
    }
  }

  if (subView === "photo") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-4">
          <ImageUploader
            bucket="product-images"
            label="Photo du produit"
            currentUrl={imageUrl}
            onUpload={setImageUrl}
            onRemove={() => setImageUrl(null)}
            square
          />
        </div>
        <div className="mt-auto border-t border-border bg-background py-3">
          <Button
            type="button"
            onClick={() => changeSubView("main")}
            style={{ backgroundColor: "var(--color-bento-accent)" }}
            className="w-full text-white hover:opacity-90"
          >
            Valider
          </Button>
        </div>
      </div>
    );
  }

  if (subView === "tags") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-3">
          <TagSelector selected={tags} onChange={setTags} disabled={isSubmitting} />
        </div>
        <div className="mt-auto border-t border-border bg-background py-3">
          <Button
            type="button"
            onClick={() => changeSubView("main")}
            style={{ backgroundColor: "var(--color-bento-accent)" }}
            className="w-full text-white hover:opacity-90"
          >
            Valider
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
        <Label>Catégorie *</Label>
        <Select
          value={categoryId}
          items={categorySelectItems}
          onValueChange={(val) => {
            if (val) setValue("category_id", val, { shouldValidate: true });
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir une catégorie…" />
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
        <Label htmlFor="name">Nom *</Label>
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Décrivez brièvement votre produit"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <Label htmlFor="price">Prix (€) *</Label>
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
        <Label>Photo du produit</Label>
        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("photo")}>
          {imageUrl ? "Modifier la photo du produit" : "Ajouter une photo du produit"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Allergènes et labels</Label>
        <Button type="button" variant="outline" className="w-full justify-between" onClick={() => changeSubView("tags")}>
          <span>Sélectionner</span>
          <Badge variant="secondary">{tags.length}</Badge>
        </Button>
      </div>

      {/* Option label */}
      <div className="space-y-1.5">
        <Label htmlFor="option_label">Option / Variante</Label>
        <Input
          id="option_label"
          {...register("option_label")}
          placeholder="Ex : Cuisson ? Taille ? (vide = pas d'option)"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Laissez vide si le produit n&apos;a pas d&apos;option. Cette question sera posée au client au moment de la commande.
        </p>
      </div>

      <Separator />

      {/* Display order + available */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="space-y-1.5 w-28">
          <Label htmlFor="display_order">Ordre</Label>
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
            <p className="text-sm font-medium">Disponible</p>
            <p className="text-xs text-muted-foreground">
              Visible et commandable sur la vitrine
            </p>
          </div>
        </div>
      </div>
      </div>

      {/* Actions */}
      <div
        className={`mt-auto flex w-full gap-2 border-t border-border bg-background py-3 ${
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
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className={sheetCtasFullWidth ? "flex-1 text-white hover:opacity-90" : "flex-1 text-white hover:opacity-90 md:flex-none"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : isEdit ? (
            "Mettre à jour"
          ) : (
            "Créer le produit"
          )}
        </Button>
      </div>
    </form>
  );
}
