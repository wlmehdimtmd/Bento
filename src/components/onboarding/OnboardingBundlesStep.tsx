"use client";

import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
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
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";

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

interface SlotState {
  category_id: string;
  quantity: number;
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
  slots: [{ category_id: "", quantity: 1 }],
};

export function OnboardingBundlesStep({
  shopId,
  categories,
  initialBundles,
  isPreview = false,
  onCatalogChanged,
}: OnboardingBundlesStepProps) {
  const [bundles, setBundles] = useState<BundleItem[]>(initialBundles);
  const [showForm, setShowForm] = useState(false);
  const [formPresentation, setFormPresentation] = useState<"drawer" | "sheet">("sheet");
  const [subView, setSubView] = useState<"main" | "composition">("main");
  const [form, setForm] = useState<BundleFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile(640);

  const supabase = createClient();

  useEffect(() => {
    setBundles(initialBundles);
  }, [initialBundles]);

  function notify() {
    onCatalogChanged?.();
  }

  function addSlot() {
    setForm((f) => ({
      ...f,
      slots: [...f.slots, { category_id: "", quantity: 1 }],
    }));
  }

  function removeSlot(i: number) {
    setForm((f) => ({
      ...f,
      slots: f.slots.filter((_, idx) => idx !== i),
    }));
  }

  function updateSlot(i: number, field: keyof SlotState, value: string | number) {
    setForm((f) => ({
      ...f,
      slots: f.slots.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }));
  }

  function setSlotCategory(i: number, val: string) {
    updateSlot(i, "category_id", val);
  }

  function closeForm() {
    setShowForm(false);
    setSubView("main");
    setForm(EMPTY_FORM);
  }

  async function saveBundle() {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error("Prix invalide");
      return;
    }

    const validSlots = form.slots.filter((s) => s.category_id.trim());
    if (validSlots.length === 0) {
      toast.error("Ajoutez au moins un choix avec une catégorie");
      return;
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
      toast.success("Formule créée (simulation) !");
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
      label: catNameById[s.category_id] || "Choix",
      quantity: s.quantity,
      display_order: i,
    }));

    const { error: slotsError } = await supabase.from("bundle_slots").insert(slotsPayload);
    setSaving(false);

    if (slotsError) {
      toast.error(slotsError.message);
      return;
    }

    toast.success("Formule créée !");
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
    <div className="sticky bottom-0 mt-auto border-t border-border bg-background py-3">
      <div className="flex items-center justify-between gap-3">
      <Button
        variant="outline"
        type="button"
          onClick={closeForm}
        className="flex-1"
      >
        Annuler
      </Button>
      <Button
        type="button"
        onClick={() => void saveBundle()}
        disabled={saving}
        style={{ backgroundColor: "var(--color-bento-accent)" }}
        className="text-white hover:opacity-90 flex-1"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer la formule"}
      </Button>
      </div>
    </div>
  );

  const compositionPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Composition *</p>
            <p className="text-xs text-muted-foreground">
              Pour chaque étape, choisissez une catégorie : l’intitulé sera son nom.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSlot}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter un choix
          </Button>
        </div>

        {form.slots.map((slot, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GripVertical className="h-3.5 w-3.5" />
                Choix {i + 1}
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
                          ? "rounded-full border border-[var(--color-bento-accent)] bg-[var(--color-bento-accent)]/10 px-2.5 py-1 text-xs font-medium text-foreground"
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
                  Désélectionner la catégorie
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-border bg-background py-3">
        <Button
          type="button"
          onClick={() => setSubView("main")}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className="w-full text-white hover:opacity-90"
        >
          Valider
        </Button>
      </div>
    </div>
  );

  const bundleFormPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <div className="space-y-1.5">
          <Label>Nom de la formule *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Menu Midi, Formule Découverte…"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez la formule…"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Prix (€) *</Label>
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
          <span>Composition du menu</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{form.slots.length} choix</span>
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
        title="Formules"
        subtitle="Composez des menus ou offres groupées : elles s’affichent comme des tuiles sur votre vitrine."
      />

      <div className="space-y-2">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{bundle.name}</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-bento-accent)" }}>
                {bundle.price.toFixed(2)}&nbsp;€
              </p>
            </div>
            <button
              type="button"
              onClick={() => void deleteBundle(bundle.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Supprimer"
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
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--color-bento-accent)] hover:text-[var(--color-bento-accent)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Créer une formule
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
                  aria-label="Retour"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>{subView === "composition" ? "Composition du menu" : "Nouvelle formule"}</DrawerTitle>
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
                  aria-label="Retour"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>{subView === "composition" ? "Composition du menu" : "Nouvelle formule"}</SheetTitle>
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
