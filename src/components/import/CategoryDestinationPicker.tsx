"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CategoryDestMode = "suggested" | "single";

interface CategoryOption {
  id: string;
  name: string;
}

interface CategoryDestinationPickerProps {
  mode: CategoryDestMode;
  onModeChange: (m: CategoryDestMode) => void;
  categories: CategoryOption[];
  singleCategoryId: string;
  onSingleCategoryId: (id: string) => void;
}

export function CategoryDestinationPicker({
  mode,
  onModeChange,
  categories,
  singleCategoryId,
  onSingleCategoryId,
}: CategoryDestinationPickerProps) {
  const categorySelectItems = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Catégorie de destination
      </p>
      <label
        className={cn(
          "flex cursor-pointer gap-2 rounded-md border p-2 text-sm transition-colors",
          mode === "suggested" ? "border-[var(--color-bento-accent)] bg-background" : "border-transparent"
        )}
      >
        <input
          type="radio"
          name="cat-dest"
          className="mt-1"
          checked={mode === "suggested"}
          onChange={() => onModeChange("suggested")}
        />
        <span>Créer les catégories suggérées par l&apos;IA (ou réutiliser si le nom existe déjà)</span>
      </label>
      <label
        className={cn(
          "flex cursor-pointer gap-2 rounded-md border p-2 text-sm transition-colors",
          mode === "single" ? "border-[var(--color-bento-accent)] bg-background" : "border-transparent"
        )}
      >
        <input
          type="radio"
          name="cat-dest"
          className="mt-1"
          checked={mode === "single"}
          onChange={() => onModeChange("single")}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          Tout mettre dans une catégorie existante
          {mode === "single" && (
            <Select
              value={singleCategoryId}
              items={categorySelectItems}
              onValueChange={(v) => {
                if (v) onSingleCategoryId(v);
              }}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </span>
      </label>
    </div>
  );
}
