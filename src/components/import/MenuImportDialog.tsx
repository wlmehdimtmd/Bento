"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ExtractedProduct } from "@/lib/types";
import { normalizeTagsForDb } from "@/lib/menu-import-tag-map";
import { MenuUploadZone } from "./MenuUploadZone";
import { MenuAnalysisProgress } from "./MenuAnalysisProgress";
import { MenuReviewList } from "./MenuReviewList";
import {
  CategoryDestinationPicker,
  type CategoryDestMode,
} from "./CategoryDestinationPicker";
import type { LocalExtractedProduct } from "./ExtractedProductCard";
import { maybeCompressImageForUpload } from "@/lib/compress-image-client";

type Step = "upload" | "analyze" | "review";

interface CategoryOption {
  id: string;
  name: string;
}

interface MenuImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  categories: CategoryOption[];
  onImported: () => void;
  /** Fichier déposé sur la zone hors dialog (ex. bouton onboarding) */
  bootstrapFile?: File | null;
  onBootstrapConsumed?: () => void;
}

function keyCat(s: string) {
  return s.trim().toLowerCase();
}

async function maxProductOrder(
  supabase: ReturnType<typeof createClient>,
  categoryId: string
): Promise<number> {
  const { data } = await supabase
    .from("products")
    .select("display_order")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.display_order ?? -1;
}

export function MenuImportDialog({
  open,
  onOpenChange,
  shopId,
  categories,
  onImported,
  bootstrapFile,
  onBootstrapConsumed,
}: MenuImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [products, setProducts] = useState<LocalExtractedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [destMode, setDestMode] = useState<CategoryDestMode>("suggested");
  const [singleCategoryId, setSingleCategoryId] = useState(
    () => categories[0]?.id ?? ""
  );
  const [importing, setImporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const onBootstrapConsumedRef = useRef(onBootstrapConsumed);
  onBootstrapConsumedRef.current = onBootstrapConsumed;

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStep("upload");
    setProducts([]);
    setSelectedIds(new Set());
    setDestMode("suggested");
    setSingleCategoryId(categories[0]?.id ?? "");
    setImporting(false);
  }, [categories]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (open && categories[0]?.id && !singleCategoryId) {
      setSingleCategoryId(categories[0].id);
    }
  }, [open, categories, singleCategoryId]);

  const runExtraction = useCallback(async (file: File) => {
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setStep("analyze");

    const fileToSend = await maybeCompressImageForUpload(file);
    const formData = new FormData();
    formData.append("file", fileToSend);

    const timeout = window.setTimeout(() => abortRef.current?.abort(), 32_000);

    try {
      const res = await fetch("/api/import-menu", {
        method: "POST",
        body: formData,
        signal,
      });
      clearTimeout(timeout);
      const json = (await res.json()) as {
        products?: ExtractedProduct[];
        message?: string;
        warning?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(json.error ?? "Erreur lors de l'analyse");
        setStep("upload");
        return;
      }

      if (json.warning) toast.message(json.warning);

      const list = json.products ?? [];
      if (list.length === 0) {
        toast.info(json.message ?? "Aucun produit détecté.");
        setStep("upload");
        return;
      }

      const local: LocalExtractedProduct[] = list.map((p) => ({
        ...p,
        description: p.description ?? "",
        tags: Array.isArray(p.tags) ? p.tags : [],
        _id: crypto.randomUUID(),
      }));
      setProducts(local);
      setSelectedIds(new Set(local.map((x) => x._id)));
      setStep("review");
    } catch (e: unknown) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") {
        toast.message("Analyse annulée ou délai dépassé.");
      } else {
        toast.error("Erreur réseau — réessayez.");
      }
      setStep("upload");
    }
  }, []);

  useEffect(() => {
    if (!open || !bootstrapFile) return;
    const f = bootstrapFile;
    const ALLOWED = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    const MAX = 10 * 1024 * 1024;
    onBootstrapConsumedRef.current?.();
    if (!ALLOWED.includes(f.type)) {
      toast.error("Format non supporté — JPG, PNG, WebP, GIF, HEIC ou PDF");
      return;
    }
    if (f.size > MAX) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }
    void runExtraction(f);
  }, [open, bootstrapFile, runExtraction]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onEditProduct(updated: LocalExtractedProduct) {
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  }

  async function handleConfirmImport() {
    const selected = products.filter((p) => selectedIds.has(p._id));
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins un produit.");
      return;
    }

    const mode =
      destMode === "single" && categories.length > 0 ? "single" : "suggested";
    if (mode === "single" && !singleCategoryId) {
      toast.error("Choisissez une catégorie existante.");
      return;
    }

    setImporting(true);
    const supabase = createClient();

    try {
      if (mode === "single") {
        let order = await maxProductOrder(supabase, singleCategoryId);
        for (const p of selected) {
          order += 1;
          const { error } = await supabase.from("products").insert({
            category_id: singleCategoryId,
            name: p.name.slice(0, 200),
            description: p.description?.trim() ? p.description.slice(0, 500) : null,
            price: p.price,
            tags: normalizeTagsForDb(p.tags),
            option_label: p.option_label?.trim() || null,
            is_available: true,
            display_order: order,
          });
          if (error) throw error;
        }
      } else {
        const { data: existingRows } = await supabase
          .from("categories")
          .select("id, name, display_order")
          .eq("shop_id", shopId);

        const byLower = new Map<string, string>();
        let maxCatOrder = -1;
        for (const c of existingRows ?? []) {
          byLower.set(c.name.toLowerCase(), c.id);
          maxCatOrder = Math.max(maxCatOrder, c.display_order ?? 0);
        }

        const uniqueKeys = [...new Set(selected.map((p) => keyCat(p.category_suggestion)))];
        for (const key of uniqueKeys) {
          if (byLower.has(key)) continue;
          const displayName =
            selected.find((p) => keyCat(p.category_suggestion) === key)?.category_suggestion.trim() ||
            "Autres";
          maxCatOrder += 1;
          const { data: ins, error: catErr } = await supabase
            .from("categories")
            .insert({
              shop_id: shopId,
              name: displayName.slice(0, 120),
              icon_emoji: "🍽️",
              display_order: maxCatOrder,
              is_active: true,
            })
            .select("id")
            .single();
          if (catErr) throw catErr;
          byLower.set(key, ins.id);
        }

        const nextOrderByCat = new Map<string, number>();
        for (const p of selected) {
          const kid = keyCat(p.category_suggestion);
          const catId = byLower.get(kid);
          if (!catId) continue;
          if (!nextOrderByCat.has(catId)) {
            const max = await maxProductOrder(supabase, catId);
            nextOrderByCat.set(catId, max + 1);
          }
          const displayOrder = nextOrderByCat.get(catId)!;
          nextOrderByCat.set(catId, displayOrder + 1);
          const { error } = await supabase.from("products").insert({
            category_id: catId,
            name: p.name.slice(0, 200),
            description: p.description?.trim() ? p.description.slice(0, 500) : null,
            price: p.price,
            tags: normalizeTagsForDb(p.tags),
            option_label: p.option_label?.trim() || null,
            is_available: true,
            display_order: displayOrder,
          });
          if (error) throw error;
        }
      }

      const n = selected.length;
      toast.success(
        `${n} produit${n > 1 ? "s" : ""} importé${n > 1 ? "s" : ""} avec succès !`
      );
      onImported();
      handleOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur à l'import";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  const effectiveDestMode: CategoryDestMode =
    categories.length === 0 ? "suggested" : destMode;

  function handleOpenChange(next: boolean) {
    if (!next) abortRef.current?.abort();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={step !== "analyze"}
        className="flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg max-sm:inset-x-0 max-sm:top-0 max-sm:bottom-0 max-sm:left-0 max-sm:max-h-dvh max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
          <DialogTitle className="font-heading text-base">
            {step === "upload" && "Importer mon menu avec l'IA"}
            {step === "analyze" && "Analyse en cours"}
            {step === "review" && `${products.length} produit${products.length !== 1 ? "s" : ""} trouvé${products.length !== 1 ? "s" : ""}`}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {step === "upload" && (
            <MenuUploadZone
              onFile={(file) => {
                void runExtraction(file);
              }}
            />
          )}
          {step === "analyze" && (
            <MenuAnalysisProgress
              onCancel={() => {
                abortRef.current?.abort();
                setStep("upload");
              }}
            />
          )}
          {step === "review" && (
            <div className="space-y-4">
              <MenuReviewList
                products={products}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onEdit={onEditProduct}
                onSelectAll={() => setSelectedIds(new Set(products.map((p) => p._id)))}
                onSelectNone={() => setSelectedIds(new Set())}
              />
              <CategoryDestinationPicker
                mode={effectiveDestMode}
                onModeChange={setDestMode}
                categories={categories}
                singleCategoryId={singleCategoryId || categories[0]?.id || ""}
                onSingleCategoryId={setSingleCategoryId}
              />
            </div>
          )}
        </div>

        {step === "review" && (
          <DialogFooter className="shrink-0 border-t bg-muted/40 px-4 py-3 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={importing || selectedIds.size === 0}
              onClick={() => void handleConfirmImport()}
              style={{ backgroundColor: "var(--color-bento-accent)" }}
              className="text-white hover:opacity-90"
            >
              {importing
                ? "Import…"
                : `Importer ${selectedIds.size} produit${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
