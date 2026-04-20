"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/product/ImageUploader";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────
export interface BundleSlotData {
  id?: string;            // undefined for new slots
  category_id: string;
  label: string;
  quantity: number;
  display_order: number;
}

export interface BundleRow {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  slots: BundleSlotData[];
}

interface CategoryOption {
  id: string;
  name: string;
  icon_emoji: string;
}

export type BundleSavePayload = {
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  slots: Array<{ id?: string; category_id: string; label: string; quantity: number; display_order: number }>;
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
}

// ─── Schema ───────────────────────────────────────────────────
const slotSchema = z.object({
  id: z.string().optional(),
  category_id: z.string().min(1, "Catégorie requise"),
  quantity: z.number().int().min(1, "Minimum 1"),
  display_order: z.number().int().min(0),
});

const bundleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  is_active: z.boolean(),
  slots: z
    .array(slotSchema)
    .min(1, "Ajoutez au moins un choix à la formule"),
});

type BundleFormValues = z.infer<typeof bundleSchema>;

function categoryNameForSlot(
  categoryId: string,
  categories: CategoryOption[]
): string {
  const n = categories.find((c) => c.id === categoryId)?.name?.trim();
  return n && n.length > 0 ? n : "Choix";
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
}: BundleFormProps) {
  const isEdit = !!initialData;
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );
  // Track which slot selects have been set (for controlled Select)
  const [slotCategoryValues, setSlotCategoryValues] = useState<string[]>(
    initialData?.slots.map((s) => s.category_id) ?? [""]
  );
  const [subView, setSubView] = useState<"main" | "photo" | "composition">("main");

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
    formState: { errors, isSubmitting },
  } = useForm<BundleFormValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? undefined,
      is_active: initialData?.is_active ?? true,
      slots:
        initialData?.slots.length
          ? initialData.slots.map((s, i) => ({
              id: s.id,
              category_id: s.category_id,
              quantity: s.quantity,
              display_order: i,
            }))
          : [{ category_id: "", quantity: 1, display_order: 0 }],
    },
  });

  const isActive = watch("is_active");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "slots",
  });

  function addSlot() {
    append({
      category_id: "",
      quantity: 1,
      display_order: fields.length,
    });
    setSlotCategoryValues((prev) => [...prev, ""]);
  }

  function removeSlot(idx: number) {
    remove(idx);
    setSlotCategoryValues((prev) => prev.filter((_, i) => i !== idx));
  }

  function setSlotCategory(idx: number, val: string) {
    setSlotCategoryValues((prev) =>
      prev.map((v, i) => (i === idx ? val : v))
    );
    setValue(`slots.${idx}.category_id`, val, { shouldValidate: true });
  }

  async function onSubmit(values: BundleFormValues) {
    const bundlePayload: BundleSavePayload = {
      shop_id: shopId,
      name: values.name,
      description: values.description || null,
      price: values.price,
      image_url: imageUrl,
      is_active: values.is_active,
      slots: values.slots.map((s, i) => ({
        id: s.id,
        category_id: s.category_id,
        label: categoryNameForSlot(s.category_id, categories),
        quantity: s.quantity,
        display_order: i,
      })),
    };

    if (onSave) {
      try {
        const result = await onSave(bundlePayload, isEdit, initialData?.id);
        toast.success(isEdit ? "Formule mise à jour !" : "Formule créée !");
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
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

    // Delete existing slots then re-insert (simple upsert strategy)
    if (isEdit) {
      const { error } = await supabase
        .from("bundle_slots")
        .delete()
        .eq("bundle_id", bundleId);
      if (error) { toast.error(error.message); return; }
    }

    const slotsPayload = values.slots.map((s, i) => ({
      bundle_id: bundleId,
      category_id: s.category_id,
      label: categoryNameForSlot(s.category_id, categories),
      quantity: s.quantity,
      display_order: i,
    }));

    const { data: savedSlots, error: slotsError } = await supabase
      .from("bundle_slots")
      .insert(slotsPayload)
      .select();

    if (slotsError) { toast.error(slotsError.message); return; }

    toast.success(isEdit ? "Formule mise à jour !" : "Formule créée !");

    // Fetch the full bundle to return
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
        quantity: s.quantity,
        display_order: s.display_order,
      })),
    });
  }

  const compositionContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Composition *</h3>
          <p className="text-xs text-muted-foreground">
            Pour chaque étape, choisissez la catégorie : l’intitulé affiché au client sera son nom.
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
          Ajouter un choix
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
                Choix {idx + 1}
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
              <Label>Catégorie de produits *</Label>
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
                  Désélectionner la catégorie
                </button>
              ) : null}
              {errors.slots?.[idx]?.category_id && (
                <p className="text-xs text-destructive">
                  {errors.slots[idx].category_id?.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 w-32">
              <Label htmlFor={`slot-qty-${idx}`}>Quantité *</Label>
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
          </div>
        ))}
      </div>
    </div>
  );

  if (subView === "photo") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-4">
          <ImageUploader
            bucket="product-images"
            label="Image de la formule"
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
            Valider
          </Button>
        </div>
      </div>
    );
  }

  if (subView === "composition") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 space-y-4 pb-4">{compositionContent}</div>
        <div className="mt-auto border-t border-border py-3">
          <Button
            type="button"
            onClick={() => changeSubView("main")}
            style={{ backgroundColor: "var(--primary)" }}
            className="w-full text-primary-foreground hover:opacity-90"
          >
            Valider
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-6 pb-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom de la formule *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Menu Midi, Formule Découverte…"
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
          placeholder="Décrivez la formule…"
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
        <Label>Photo de la formule</Label>
        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("photo")}>
          {imageUrl ? "Modifier la photo de la formule" : "Ajouter une photo de la formule"}
        </Button>
      </div>

      {/* Active */}
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-sm font-medium">Formule active</p>
          <p className="text-xs text-muted-foreground">Visible sur la vitrine</p>
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
        <Label>Composition du menu</Label>
        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("composition")}>
          Gérer la composition
        </Button>
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
          Annuler
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
              Enregistrement…
            </>
          ) : isEdit ? (
            "Mettre à jour"
          ) : (
            "Créer la formule"
          )}
        </Button>
      </div>
    </form>
  );
}
