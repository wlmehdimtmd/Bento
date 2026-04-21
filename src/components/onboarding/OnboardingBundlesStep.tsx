"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Loader2, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CategoryItem {
  id: string;
  name: string;
  icon_emoji: string;
}

interface BundleItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface OnboardingBundlesStepProps {
  shopId: string;
  categories: CategoryItem[];
  initialBundles: BundleItem[];
  isPreview?: boolean;
  onCatalogChanged?: () => void;
}

interface ShopProductRow {
  id: string;
  category_id: string;
  name: string;
  name_fr: string | null;
  name_en: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
}

interface SlotState {
  category_id: string;
  quantity: number;
  excluded_product_ids: string[];
}

interface BundleFormState {
  name: string;
  description: string;
  price: string;
  slots: SlotState[];
}

const EMPTY_FORM: BundleFormState = {
  name: "",
  description: "",
  price: "",
  slots: [{ category_id: "", quantity: 1, excluded_product_ids: [] }],
};

function productRowLabel(p: ShopProductRow, locale: string): string {
  if (locale === "en") {
    return (p.name_en?.trim() || p.name_fr?.trim() || p.name).trim();
  }
  return (p.name_fr?.trim() || p.name).trim();
}

function categoryProductIdSet(products: ShopProductRow[], categoryId: string): Set<string> {
  return new Set(products.filter((x) => x.category_id === categoryId).map((x) => x.id));
}

function sanitizeExcludedForCategory(
  categoryId: string,
  excluded: string[] | undefined,
  products: ShopProductRow[]
): string[] {
  if (!categoryId) return [];
  const allow = categoryProductIdSet(products, categoryId);
  return (excluded ?? []).filter((id) => allow.has(id));
}

export function OnboardingBundlesStep({
  shopId,
  categories,
  initialBundles,
  isPreview = false,
  onCatalogChanged,
}: OnboardingBundlesStepProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const [bundles, setBundles] = useState<BundleItem[]>(initialBundles);
  const [showForm, setShowForm] = useState(false);
  const [formPresentation, setFormPresentation] = useState<"drawer" | "sheet">("sheet");
  const [subView, setSubView] = useState<"main" | "composition">("main");
  const [form, setForm] = useState<BundleFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProductRow[]>([]);
  const [slotDishSectionOpen, setSlotDishSectionOpen] = useState<Record<number, boolean>>({});
  const isMobile = useIsMobile(640);

  const supabase = createClient();

  useEffect(() => {
    setBundles(initialBundles);
  }, [initialBundles]);

  useEffect(() => {
    if (isPreview) {
      setShopProducts([]);
      return;
    }
    const catIds = categories.map((c) => c.id);
    if (catIds.length === 0) {
      setShopProducts([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, category_id, name, name_fr, name_en, price, is_available, display_order")
        .in("category_id", catIds)
        .order("display_order");
      if (error) {
        console.error(error);
        return;
      }
      if (!cancelled && data) {
        setShopProducts(
          data.map((p) => ({
            id: p.id,
            category_id: p.category_id,
            name: p.name,
            name_fr: p.name_fr ?? null,
            name_en: p.name_en ?? null,
            price: Number(p.price),
            is_available: p.is_available ?? true,
            display_order: p.display_order ?? 0,
          }))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shopId, isPreview, supabase, categories]);

  function notify() {
    onCatalogChanged?.();
  }

  function addSlot() {
    setForm((f) => ({
      ...f,
      slots: [...f.slots, { category_id: "", quantity: 1, excluded_product_ids: [] }],
    }));
  }

  function removeSlot(i: number) {
    setForm((f) => ({
      ...f,
      slots: f.slots.filter((_, idx) => idx !== i),
    }));
  }

  function setSlotCategory(i: number, val: string) {
    setForm((f) => {
      const prev = f.slots[i]?.category_id ?? "";
      const clearExcluded = (prev && prev !== val) || !val;
      if (prev && prev !== val) {
        toast.info(
          tr(
            "Les réglages des plats ont été réinitialisés (nouvelle catégorie).",
            "Dish settings were reset because the category changed."
          )
        );
      }
      return {
        ...f,
        slots: f.slots.map((s, idx) =>
          idx === i
            ? {
                ...s,
                category_id: val,
                excluded_product_ids: clearExcluded ? [] : s.excluded_product_ids,
              }
            : s
        ),
      };
    });
  }

  function setSlotProductOffered(i: number, productId: string, offered: boolean) {
    setForm((f) => ({
      ...f,
      slots: f.slots.map((s, idx) => {
        if (idx !== i) return s;
        const cur = s.excluded_product_ids ?? [];
        const next = offered ? cur.filter((id) => id !== productId) : [...cur, productId];
        return { ...s, excluded_product_ids: next };
      }),
    }));
  }

  function closeForm() {
    setShowForm(false);
    setSubView("main");
    setForm(EMPTY_FORM);
  }

  async function saveBundle() {
    if (!form.name.trim()) {
      toast.error(tr("Le nom est requis", "Name is required"));
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error(tr("Prix invalide", "Invalid price"));
      return;
    }

    const validSlots = form.slots.filter((s) => s.category_id.trim());
    if (validSlots.length === 0) {
      toast.error(tr("Ajoutez au moins un choix avec une catégorie", "Add at least one option with a category"));
      return;
    }

    for (const s of validSlots) {
      const excluded = sanitizeExcludedForCategory(s.category_id, s.excluded_product_ids, shopProducts);
      const anyAvailable = shopProducts.some((p) => p.category_id === s.category_id && p.is_available);
      const remaining = shopProducts.filter(
        (p) => p.category_id === s.category_id && p.is_available && !excluded.includes(p.id)
      );
      if (anyAvailable && remaining.length === 0) {
        toast.error(
          tr(
            "Au moins un plat disponible doit rester proposé pour chaque choix. Vérifiez les plats retirés de la formule.",
            "At least one available dish must remain offered for each step. Check which dishes are removed from this bundle."
          )
        );
        return;
      }
    }

    setSaving(true);

    if (isPreview) {
      const row: BundleItem = {
        id: `preview-bundle-${crypto.randomUUID()}`,
        name: form.name.trim(),
        description: form.description || null,
        price,
      };
      setBundles((prev) => [...prev, row]);
      setSaving(false);
      toast.success(tr("Formule créée (simulation) !", "Bundle created (preview)!"));
      closeForm();
      notify();
      return;
    }

    const { data: bundle, error: bundleError } = await supabase
      .from("bundles")
      .insert({
        shop_id: shopId,
        name: form.name.trim(),
        description: form.description || null,
        price,
        is_active: true,
      })
      .select("id, name, description, price")
      .single();

    if (bundleError) {
      setSaving(false);
      toast.error(bundleError.message);
      return;
    }

    const catNameById = Object.fromEntries(categories.map((c) => [c.id, c.name.trim()]));

    const slotsPayload = validSlots.map((s, i) => ({
      bundle_id: bundle.id,
      category_id: s.category_id,
      label: catNameById[s.category_id] || tr("Choix", "Option"),
      quantity: s.quantity,
      display_order: i,
      excluded_product_ids: sanitizeExcludedForCategory(
        s.category_id,
        s.excluded_product_ids,
        shopProducts
      ),
    }));

    const { error: slotsError } = await supabase.from("bundle_slots").insert(slotsPayload);
    setSaving(false);

    if (slotsError) {
      toast.error(slotsError.message);
      return;
    }

    toast.success(tr("Formule créée !", "Bundle created!"));
    setBundles((prev) => [...prev, bundle as BundleItem]);
    closeForm();
    notify();
  }

  async function deleteBundle(id: string) {
    if (isPreview) {
      setBundles((prev) => prev.filter((b) => b.id !== id));
      notify();
      return;
    }
    const { error } = await supabase.from("bundles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBundles((prev) => prev.filter((b) => b.id !== id));
    notify();
  }

  const formFooter = (
    <div className="sticky bottom-0 mt-auto border-t border-border py-3">
      <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        type="button"
          onClick={closeForm}
        className="flex-1"
      >
        {tr("Annuler", "Cancel")}
      </Button>
      <Button
        type="button"
        onClick={() => void saveBundle()}
        disabled={saving}
        style={{ backgroundColor: "var(--primary)" }}
        className="text-primary-foreground hover:opacity-90 flex-1"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("Créer la formule", "Create bundle")}
      </Button>
      </div>
    </div>
  );

  const compositionPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{tr("Composition", "Composition")} *</p>
            <p className="text-xs text-muted-foreground">
              {tr("Pour chaque étape, choisissez une catégorie : l’intitulé sera son nom.", "For each step, choose a category: its name will be used as label.")}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSlot}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {tr("Ajouter un choix", "Add option")}
          </Button>
        </div>

        {form.slots.map((slot, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GripVertical className="h-3.5 w-3.5" />
                {tr("Choix", "Option")} {i + 1}
              </div>
              {form.slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => {
                  const active = slot.category_id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSlotCategory(i, c.id)}
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
              {slot.category_id ? (
                <button
                  type="button"
                  onClick={() => setSlotCategory(i, "")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {tr("Désélectionner la catégorie", "Deselect category")}
                </button>
              ) : null}
            </div>

            {slot.category_id ? (
              (() => {
                const catId = slot.category_id;
                const rowProducts = shopProducts
                  .filter((p) => p.category_id === catId)
                  .sort((a, b) => a.display_order - b.display_order);
                const excluded = slot.excluded_product_ids ?? [];
                const excludedCount = excluded.length;
                const expanded = slotDishSectionOpen[i] ?? false;
                return (
                  <div className="space-y-2 rounded-md border border-border bg-background/50 p-2">
                    <button
                      type="button"
                      onClick={() => setSlotDishSectionOpen((m) => ({ ...m, [i]: !m[i] }))}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span className="text-xs font-medium">
                        {tr("Plats proposés pour ce choix", "Dishes offered for this step")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>
                    {expanded ? (
                      <>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {tr(
                            "Tous les plats de la catégorie sont proposés aux clients. Retirez de la formule ceux qui ne conviennent pas (prix, carte…).",
                            "All dishes in this category are offered to customers by default. Remove from this bundle any that shouldn’t apply (price, menu rules…)."
                          )}
                        </p>
                        {rowProducts.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            {tr("Aucun produit dans cette catégorie.", "No products in this category.")}
                          </p>
                        ) : (
                          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-0.5">
                            {rowProducts.map((product) => {
                              const offered = !excluded.includes(product.id);
                              const label = productRowLabel(product, locale);
                              return (
                                <div
                                  key={product.id}
                                  className={cn(
                                    "flex items-center justify-between gap-2 rounded border border-border/60 px-1.5 py-1.5",
                                    !product.is_available && "opacity-70"
                                  )}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium">{label}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {formatPrice(product.price)}
                                    </p>
                                  </div>
                                  {!product.is_available ? (
                                    <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                                      {tr("Indisponible", "Unavailable")}
                                    </Badge>
                                  ) : (
                                    <Switch
                                      checked={offered}
                                      onCheckedChange={(checked) =>
                                        setSlotProductOffered(i, product.id, checked)
                                      }
                                      aria-label={tr("Retirer de la formule", "Remove from this bundle")}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {excludedCount > 0 ? (
                          <p className="text-[11px] text-muted-foreground">
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
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-border py-3">
        <Button
          type="button"
          onClick={() => setSubView("main")}
          style={{ backgroundColor: "var(--primary)" }}
          className="w-full text-primary-foreground hover:opacity-90"
        >
          {tr("Valider", "Confirm")}
        </Button>
      </div>
    </div>
  );

  const bundleFormPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <div className="space-y-1.5">
          <Label>{tr("Nom de la formule", "Bundle name")} *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={tr("Menu Midi, Formule Découverte…", "Lunch Menu, Discovery Bundle...")}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>{tr("Description", "Description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={tr("Décrivez la formule…", "Describe the bundle...")}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{tr("Prix (€)", "Price (€)")} *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="0,00"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("composition")}
          className="h-12 w-full justify-between rounded-xl px-3 text-base"
        >
          <span>{tr("Composition du menu", "Menu composition")}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{form.slots.length} {tr("choix", "options")}</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
      {formFooter}
    </div>
  );

  return (
    <div className="space-y-5 pt-2">
      <OnboardingStepTitle
        title={tr("Formules", "Bundles")}
        subtitle={tr("Composez des menus ou offres groupées : elles s’affichent comme des tuiles sur votre vitrine.", "Create menus or bundled offers: they appear as tiles on your storefront.")}
      />

      <div className="space-y-2">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{bundle.name}</p>
              <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                {bundle.price.toFixed(2)}&nbsp;€
              </p>
            </div>
            <button
              type="button"
              onClick={() => void deleteBundle(bundle.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label={tr("Supprimer", "Delete")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            setFormPresentation(isMobile ? "drawer" : "sheet");
            setSubView("main");
            setShowForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          {tr("Créer une formule", "Create bundle")}
        </button>
      </div>

      {formPresentation === "drawer" ? (
        <Drawer
          open={showForm}
          onOpenChange={(open) => {
            if (open) {
              setShowForm(true);
              return;
            }
            closeForm();
          }}
        >
          <DrawerContent className="flex max-h-[92vh] flex-col overflow-hidden">
            <DrawerHeader className={subView !== "main" ? "flex-row items-center gap-2" : undefined}>
              {subView !== "main" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>{subView === "composition" ? tr("Composition du menu", "Menu composition") : tr("Nouvelle formule", "New bundle")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              {subView === "composition" ? compositionPanel : bundleFormPanel}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet
          open={showForm}
          onOpenChange={(open) => {
            if (open) {
              setShowForm(true);
              return;
            }
            closeForm();
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-2xl h-full overflow-hidden">
            <SheetHeader className={subView !== "main" ? "flex-row items-center gap-2" : undefined}>
              {subView !== "main" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>{subView === "composition" ? tr("Composition du menu", "Menu composition") : tr("Nouvelle formule", "New bundle")}</SheetTitle>
            </SheetHeader>
            <div className="h-full min-h-0 overflow-y-auto px-4 pb-4">
              {subView === "composition" ? compositionPanel : bundleFormPanel}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
