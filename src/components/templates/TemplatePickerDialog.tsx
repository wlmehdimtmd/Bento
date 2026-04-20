"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  BusinessType,
  CategoryTemplate,
  ProductTemplate,
  BundleTemplate,
  BundleTemplateSlot,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedProduct {
  templateId: string;
  categoryTemplateId: string;
  name: string;
  description: string | null;
  price: number;
  tags: string[];
  option_label: string | null;
}

export interface SelectedCategory {
  templateId: string;
  name: string;
  products: SelectedProduct[];
}

export interface SelectedBundle {
  templateId: string;
  name: string;
  description: string | null;
  price: number;
  slots: { categoryTemplateId: string | null }[];
}

export interface ImportData {
  categories: SelectedCategory[];
  bundles: SelectedBundle[];
}

export interface TemplatePickerDialogProps {
  mode: "full" | "categories" | "products" | "bundles";
  targetCategoryId?: string;
  shopCategories?: { id: string; name: string }[];
  onImport: (data: ImportData) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface CategoryWithProducts extends CategoryTemplate {
  products: ProductTemplate[];
}

interface BusinessTypeWithData extends BusinessType {
  categories: CategoryWithProducts[];
  bundles: (BundleTemplate & { slots: BundleTemplateSlot[] })[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TemplatePickerDialog({
  mode,
  onImport,
  open,
  onOpenChange,
}: TemplatePickerDialogProps) {
  const [data, setData] = useState<BusinessTypeWithData[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Selection state: Map of productTemplateId → price override
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  // Set of categoryTemplateId (for categories that have all products selected)
  const [selectedBundles, setSelectedBundles] = useState<Set<string>>(new Set());

  // ── Fetch data ───────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables templates hors types générés
    const db: any = supabase;

    const [btRes, catRes, prodRes, bundleRes, slotRes] = await Promise.all([
      db.from("business_types").select("*").eq("is_active", true).order("position"),
      db.from("category_templates").select("*").eq("is_active", true).order("position"),
      db.from("product_templates").select("*").eq("is_active", true).order("position"),
      db.from("bundle_templates").select("*").eq("is_active", true).order("position"),
      db.from("bundle_template_slots").select("*").order("position"),
    ]);

    const businessTypes: BusinessType[] = btRes.data ?? [];
    const categories: CategoryTemplate[] = catRes.data ?? [];
    const products: ProductTemplate[] = prodRes.data ?? [];
    const bundles: BundleTemplate[] = bundleRes.data ?? [];
    const slots: BundleTemplateSlot[] = slotRes.data ?? [];

    const catMap = new Map<string, CategoryWithProducts>();
    for (const cat of categories) {
      catMap.set(cat.id, { ...cat, products: [] });
    }
    for (const prod of products) {
      catMap.get(prod.category_template_id)?.products.push({
        ...prod,
        default_price: prod.default_price,
        tags: Array.isArray(prod.tags) ? prod.tags : [],
      });
    }

    const slotsByBundle = new Map<string, BundleTemplateSlot[]>();
    for (const slot of slots) {
      const arr = slotsByBundle.get(slot.bundle_template_id) ?? [];
      arr.push(slot);
      slotsByBundle.set(slot.bundle_template_id, arr);
    }

    const result: BusinessTypeWithData[] = businessTypes.map((bt) => ({
      ...bt,
      categories: categories
        .filter((c) => c.business_type_id === bt.id)
        .map((c) => catMap.get(c.id)!)
        .filter(Boolean),
      bundles: bundles
        .filter((b) => b.business_type_id === bt.id)
        .map((b) => ({ ...b, slots: slotsByBundle.get(b.id) ?? [] })),
    }));

    setData(result);
    // Expand all categories by default
    const allCatIds = new Set(categories.map((c) => c.id));
    setExpandedCategories(allCatIds);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setSearch("");
      setSelectedProducts(new Map());
      setSelectedBundles(new Set());
      setActiveType(null);
    }
  }, [open, fetchTemplates]);

  // ── Filtered data ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data
      .filter((bt) => !activeType || bt.id === activeType)
      .map((bt) => ({
        ...bt,
        categories: bt.categories
          .map((cat) => ({
            ...cat,
            products: cat.products.filter((p) => {
              if (!q) return true;
              return (
                p.name.toLowerCase().includes(q) ||
                (p.description ?? "").toLowerCase().includes(q) ||
                cat.name.toLowerCase().includes(q) ||
                (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
              );
            }),
          }))
          .filter((cat) => !q || cat.products.length > 0),
        bundles: bt.bundles.filter((b) => {
          if (!q) return true;
          return b.name.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q);
        }),
      }))
      .filter((bt) => bt.categories.length > 0 || bt.bundles.length > 0);
  }, [data, search, activeType]);

  // ── Selection helpers ────────────────────────────────────────────────────────

  function isCategoryFullySelected(cat: CategoryWithProducts): boolean {
    return cat.products.length > 0 && cat.products.every((p) => selectedProducts.has(p.id));
  }

  function isCategoryPartiallySelected(cat: CategoryWithProducts): boolean {
    return cat.products.some((p) => selectedProducts.has(p.id)) && !isCategoryFullySelected(cat);
  }

  function toggleProduct(prod: ProductTemplate) {
    setSelectedProducts((prev) => {
      const next = new Map(prev);
      if (next.has(prod.id)) {
        next.delete(prod.id);
      } else {
        next.set(prod.id, prod.default_price ?? 0);
      }
      return next;
    });
  }

  function toggleCategory(cat: CategoryWithProducts) {
    const allSelected = isCategoryFullySelected(cat);
    setSelectedProducts((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        cat.products.forEach((p) => next.delete(p.id));
      } else {
        cat.products.forEach((p) => {
          if (!next.has(p.id)) next.set(p.id, p.default_price ?? 0);
        });
      }
      return next;
    });
  }

  function toggleBundle(bundleId: string) {
    setSelectedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(bundleId)) next.delete(bundleId);
      else next.add(bundleId);
      return next;
    });
  }

  function updatePrice(prodId: string, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setSelectedProducts((prev) => new Map(prev).set(prodId, num));
    }
  }

  function toggleExpand(catId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  // ── Selection count ──────────────────────────────────────────────────────────

  const selectedProductCount = selectedProducts.size;
  const selectedCategoryCount = useMemo(() => {
    const catIds = new Set<string>();
    for (const bt of data) {
      for (const cat of bt.categories) {
        if (cat.products.some((p) => selectedProducts.has(p.id))) {
          catIds.add(cat.id);
        }
      }
    }
    return catIds.size;
  }, [data, selectedProducts]);
  const selectedBundleCount = selectedBundles.size;

  // ── Import ───────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (mode === "bundles") {
      if (selectedBundles.size === 0) {
        toast.error("Sélectionnez au moins une formule.");
        return;
      }
    } else {
      if (selectedProducts.size === 0 && selectedBundles.size === 0) {
        toast.error("Sélectionnez au moins un produit ou une formule.");
        return;
      }
    }

    setImporting(true);
    try {
      // Build categories from selected products
      const catMap = new Map<string, SelectedCategory>();
      for (const bt of data) {
        for (const cat of bt.categories) {
          const selectedProds = cat.products
            .filter((p) => selectedProducts.has(p.id))
            .map((p) => ({
              templateId: p.id,
              categoryTemplateId: cat.id,
              name: p.name,
              description: p.description,
              price: selectedProducts.get(p.id) ?? p.default_price ?? 0,
              tags: p.tags,
              option_label: p.option_label,
            }));
          if (selectedProds.length > 0) {
            catMap.set(cat.id, {
              templateId: cat.id,
              name: cat.name,
              products: selectedProds,
            });
          }
        }
      }

      // Build bundles
      const bundles: SelectedBundle[] = [];
      for (const bt of data) {
        for (const bundle of bt.bundles) {
          if (selectedBundles.has(bundle.id)) {
            bundles.push({
              templateId: bundle.id,
              name: bundle.name,
              description: bundle.description,
              price: bundle.default_price ?? 0,
              slots: bundle.slots.map((s) => ({
                categoryTemplateId: s.category_template_id,
              })),
            });
          }
        }
      }

      await onImport({
        categories: Array.from(catMap.values()),
        bundles,
      });

      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const showProducts = mode !== "bundles";
  const showBundles = mode === "bundles" || mode === "full";

  const selectionLabel = useMemo(() => {
    const parts: string[] = [];
    if (showProducts && selectedProductCount > 0) {
      parts.push(`${selectedProductCount} produit${selectedProductCount > 1 ? "s" : ""}`);
      if (selectedCategoryCount > 0) parts.push(`${selectedCategoryCount} catégorie${selectedCategoryCount > 1 ? "s" : ""}`);
    }
    if (showBundles && selectedBundleCount > 0) {
      parts.push(`${selectedBundleCount} formule${selectedBundleCount > 1 ? "s" : ""}`);
    }
    return parts.length > 0 ? `Sélection : ${parts.join(", ")}` : "Aucune sélection";
  }, [showProducts, showBundles, selectedProductCount, selectedCategoryCount, selectedBundleCount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
            {mode === "bundles" ? "Ajouter des formules depuis un modèle" : "Ajouter depuis un modèle"}
          </DialogTitle>
        </div>

        {/* Search + Type filter */}
        <div className="px-6 pt-3 pb-2 space-y-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={mode === "bundles" ? "Rechercher une formule…" : "Rechercher un produit, une catégorie…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Type filter pills — une ligne, scroll horizontal ; pb interne = air sous les toggles avant la barre */}
          <div className="-mx-6 px-6 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin]">
            <div className="inline-flex max-w-none flex-nowrap gap-2 pb-[4px]">
              <button
                type="button"
                onClick={() => setActiveType(null)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  !activeType
                    ? "bg-[var(--color-bento-accent)] text-white border-transparent"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Tous
              </button>
              {data.map((bt) => (
                <button
                  type="button"
                  key={bt.id}
                  onClick={() => setActiveType(bt.id === activeType ? null : bt.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                    bt.id === activeType
                      ? "bg-[var(--color-bento-accent)] text-white border-transparent"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {bt.icon} {bt.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            filtered.map((bt) => (
              <div key={bt.id}>
                {/* Business type header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{bt.icon}</span>
                  <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-onest)" }}>
                    {bt.name}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Categories + Products */}
                {showProducts && bt.categories.map((cat) => (
                  <div key={cat.id} className="mb-2">
                    {/* Category row */}
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={isCategoryFullySelected(cat)}
                        data-partial={isCategoryPartiallySelected(cat) ? "true" : undefined}
                        onCheckedChange={() => toggleCategory(cat)}
                        className={cn(isCategoryPartiallySelected(cat) && "opacity-60")}
                      />
                      <button
                        className="flex items-center gap-1.5 flex-1 text-left text-sm font-medium"
                        onClick={() => toggleExpand(cat.id)}
                      >
                        <span className="text-base">📁</span>
                        {cat.name}
                        <Badge variant="secondary" className="text-[10px] ml-1">
                          {cat.products.length}
                        </Badge>
                        {expandedCategories.has(cat.id) ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                        )}
                      </button>
                    </div>

                    {/* Products */}
                    {expandedCategories.has(cat.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {cat.products.map((prod) => {
                          const isSelected = selectedProducts.has(prod.id);
                          const price = selectedProducts.get(prod.id) ?? prod.default_price ?? 0;
                          return (
                            <div
                              key={prod.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
                                isSelected ? "bg-[var(--color-bento-accent)]/5" : "hover:bg-muted/30"
                              )}
                            >
                              <Checkbox
                                id={`prod-${prod.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleProduct(prod)}
                              />
                              <label
                                htmlFor={`prod-${prod.id}`}
                                className="flex-1 cursor-pointer min-w-0"
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-medium">{prod.name}</span>
                                  {prod.tags?.filter((t) => t).map((tag) => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {prod.description && (
                                  <p className="text-xs text-muted-foreground truncate">{prod.description}</p>
                                )}
                              </label>
                              {/* Price input */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={price}
                                  onChange={(e) => updatePrice(prod.id, e.target.value)}
                                  disabled={!isSelected}
                                  className="w-20 h-7 text-xs text-right"
                                />
                                <span className="text-xs text-muted-foreground">€</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Bundles */}
                {showBundles && bt.bundles.length > 0 && (
                  <div className={cn("space-y-1", showProducts && bt.categories.length > 0 && "mt-4")}>
                    {showProducts && bt.bundles.length > 0 && (
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-1">
                        Formules
                      </p>
                    )}
                    {bt.bundles.map((bundle) => {
                      const isSelected = selectedBundles.has(bundle.id);
                      return (
                        <div
                          key={bundle.id}
                          className={cn(
                            "flex items-start gap-2 px-2 py-2 rounded-lg transition-colors",
                            isSelected ? "bg-[var(--color-bento-accent)]/5" : "hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            id={`bundle-${bundle.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleBundle(bundle.id)}
                            className="mt-0.5"
                          />
                          <label htmlFor={`bundle-${bundle.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{bundle.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {bundle.default_price?.toFixed(2)} €
                              </Badge>
                            </div>
                            {bundle.description && (
                              <p className="text-xs text-muted-foreground">{bundle.description}</p>
                            )}
                            {bundle.slots.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {bundle.slots.length} slot{bundle.slots.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 space-y-3">
          <p className="text-xs text-muted-foreground">{selectionLabel}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || (selectedProducts.size === 0 && selectedBundles.size === 0)}
              style={{ backgroundColor: "var(--color-bento-accent)" }}
              className="text-white hover:opacity-90"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Import…
                </>
              ) : (
                "Importer la sélection"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import logic helpers (shared) ───────────────────────────────────────────

export async function importTemplatesIntoShop(
  supabase: ReturnType<typeof createClient>,
  shopId: string,
  importData: ImportData,
  existingCats: { id: string; name: string }[] = []
): Promise<{ categoryCount: number; productCount: number; bundleCount: number }> {
  let categoryCount = 0;
  let productCount = 0;
  let bundleCount = 0;

  // Map: categoryTemplateName → shopCategoryId (for bundle slot mapping)
  const catNameToId = new Map<string, string>(existingCats.map((c) => [c.name, c.id]));

  // 1. Create categories + products
  for (const selectedCat of importData.categories) {
    // Check if a category with same name already exists
    let catId = catNameToId.get(selectedCat.name);

    if (!catId) {
      const { data: newCat, error: catError } = await supabase
        .from("categories")
        .insert({
          shop_id: shopId,
          name: selectedCat.name,
          display_order: 999 + categoryCount,
          is_active: true,
        })
        .select("id, name")
        .single();

      if (catError || !newCat) {
        toast.error(`Erreur catégorie "${selectedCat.name}": ${catError?.message}`);
        continue;
      }

      catId = newCat.id;
      catNameToId.set(selectedCat.name, catId);
      categoryCount++;
    }

    // Create products in that category
    for (let pi = 0; pi < selectedCat.products.length; pi++) {
      const p = selectedCat.products[pi];
      const { error: prodError } = await supabase.from("products").insert({
        category_id: catId,
        name: p.name,
        description: p.description,
        price: p.price,
        tags: p.tags ?? [],
        option_label: p.option_label,
        display_order: pi,
        is_available: true,
      });

      if (prodError) {
        toast.error(`Erreur produit "${p.name}": ${prodError.message}`);
      } else {
        productCount++;
      }
    }
  }

  // 2. Create bundles
  // Build template cat id → shop cat id mapping for slots
  // We need category_templates data to match slot.categoryTemplateId → catName → shopCatId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table templates hors types générés
  const { data: catTemplates } = await (supabase as any)
    .from("category_templates")
    .select("id, name");

  const templateIdToName = new Map<string, string>(
    ((catTemplates ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  for (const bundle of importData.bundles) {
    const { data: newBundle, error: bundleError } = await supabase
      .from("bundles")
      .insert({
        shop_id: shopId,
        name: bundle.name,
        description: bundle.description,
        price: bundle.price,
        is_active: true,
      })
      .select("id")
      .single();

    if (bundleError || !newBundle) {
      toast.error(`Erreur formule "${bundle.name}": ${bundleError?.message}`);
      continue;
    }

    // Create slots
    for (let si = 0; si < bundle.slots.length; si++) {
      const slot = bundle.slots[si];
      const catName = slot.categoryTemplateId
        ? templateIdToName.get(slot.categoryTemplateId)
        : undefined;
      const shopCatId = catName ? catNameToId.get(catName) : undefined;
      if (!shopCatId) continue;

      await supabase.from("bundle_slots").insert({
        bundle_id: newBundle.id,
        category_id: shopCatId,
        label: catName || "Choix",
        quantity: 1,
        display_order: si,
      });
    }

    bundleCount++;
  }

  return { categoryCount, productCount, bundleCount };
}
