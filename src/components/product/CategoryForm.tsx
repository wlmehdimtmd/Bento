"use client";

import { useEffect, useState } from "react";
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
import { ImageUploader } from "@/components/product/ImageUploader";
import { createClient } from "@/lib/supabase/client";

// ─── Schema ───────────────────────────────────────────────────
const categorySchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().max(32, "Maximum 32 caractères").optional(),
  icon_emoji: z.string().optional(),
  is_active: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// ─── Types ────────────────────────────────────────────────────
export interface CategoryRow {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  cover_image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export type CategorySavePayload = {
  shop_id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  cover_image_url: string | null;
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
  subViewOverride?: "main" | "icon" | "cover";
  onSubViewChange?: (subView: "main" | "icon" | "cover") => void;
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
}: CategoryFormProps) {
  const isEdit = !!initialData;
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialData?.cover_image_url ?? null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      icon_emoji: initialData?.icon_emoji ?? "📦",
      is_active: initialData?.is_active ?? true,
    },
  });

  const iconEmoji = watch("icon_emoji") || "📦";
  const isActive = watch("is_active");
  const [subView, setSubView] = useState<"main" | "icon" | "cover">("main");

  useEffect(() => {
    if (subViewOverride && subViewOverride !== subView) {
      setSubView(subViewOverride);
    }
  }, [subView, subViewOverride]);

  function changeSubView(next: "main" | "icon" | "cover") {
    if (next === subView) return;
    setSubView(next);
    onSubViewChange?.(next);
  }

  async function onSubmit(values: CategoryFormValues) {
    const payload: CategorySavePayload = {
      shop_id: shopId,
      name: values.name,
      description: values.description || null,
      icon_emoji: values.icon_emoji || "📦",
      cover_image_url: coverUrl,
      is_active: values.is_active,
      display_order: initialData?.display_order ?? nextOrder,
    };

    if (onSave) {
      try {
        const result = await onSave(payload, isEdit, initialData?.id);
        toast.success(isEdit ? "Catégorie mise à jour !" : "Catégorie créée !");
        onSuccess(result);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
      return;
    }

    const supabase = createClient();

    if (isEdit) {
      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", initialData!.id)
        .select()
        .single();

      if (error) { toast.error(error.message); return; }
      toast.success("Catégorie mise à jour !");
      onSuccess(data as CategoryRow);
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert(payload)
        .select()
        .single();

      if (error) { toast.error(error.message); return; }
      toast.success("Catégorie créée !");
      onSuccess(data as CategoryRow);
    }
  }

  if (subView === "icon") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-4">
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

  if (subView === "cover") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 pb-4">
          <ImageUploader
            bucket="shop-assets"
            label="Image de couverture"
            currentUrl={coverUrl}
            onUpload={setCoverUrl}
            onRemove={() => setCoverUrl(null)}
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-5 pb-4">
        {/* Name */}
        <div className="space-y-1.5">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Entrées, Plats, Desserts…"
          disabled={isSubmitting}
          autoFocus
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
        </div>

        <div className="space-y-1.5">
          <Label>Icône</Label>
          <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={() => changeSubView("icon")}>
            <span className="text-lg leading-none">{iconEmoji}</span>
            <span>Choisir une icône</span>
          </Button>
        </div>

      {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Description optionnelle de la catégorie…"
            rows={2}
            maxLength={32}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground text-right">
            {(watch("description") ?? "").length}/32
          </p>
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Image de couverture</Label>
          <Button type="button" variant="outline" className="w-full justify-start" onClick={() => changeSubView("cover")}>
            {coverUrl ? "Modifier l’image de couverture" : "Ajouter une image de couverture"}
          </Button>
        </div>

      {/* Active toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Catégorie active</p>
            <p className="text-xs text-muted-foreground">
              Visible sur la vitrine publique
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
            "Créer la catégorie"
          )}
        </Button>
      </div>
    </form>
  );
}
