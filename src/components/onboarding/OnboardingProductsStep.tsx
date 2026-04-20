"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Loader2, Camera, X, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ImageUploader } from "@/components/product/ImageUploader";
import { TagSelector } from "@/components/product/TagSelector";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { MenuImportButton } from "@/components/onboarding/MenuImportButton";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  icon_emoji: string;
}

interface ProductItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  is_available: boolean;
  display_order: number;
}

interface OnboardingProductsStepProps {
  shopId: string;
  categories: CategoryItem[];
  initialProducts: ProductItem[];
  isPreview?: boolean;
  onCatalogChanged?: () => void;
}

interface ProductFormState {
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
  tags: string[];
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  description: "",
  price: "",
  imageUrl: null,
  tags: [],
};

export function OnboardingProductsStep({
  shopId,
  categories,
  initialProducts,
  isPreview = false,
  onCatalogChanged,
}: OnboardingProductsStepProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(categories[0]?.id ?? "");
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [formPresentation, setFormPresentation] = useState<"drawer" | "sheet">("sheet");
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [subView, setSubView] = useState<"main" | "photo" | "tags">("main");
  const isMobile = useIsMobile(640);

  const supabase = createClient();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setActiveTab((prev) => {
      if (categories.some((c) => c.id === prev)) return prev;
      return categories[0]?.id ?? "";
    });
  }, [categories]);

  function notify() {
    onCatalogChanged?.();
  }

  const activeProducts = products.filter((p) => p.category_id === activeTab);
  const activeCategory = categories.find((c) => c.id === activeTab);
  const parentUsesDrawer = formPresentation === "drawer";

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setSubView("main");
    setForm(EMPTY_FORM);
  }

  function openNewForm() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormPresentation(isMobile ? "drawer" : "sheet");
    setSubView("main");
    setShowForm(true);
  }

  function openEditForm(product: ProductItem) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      imageUrl: product.image_url,
      tags: product.tags,
    });
    setFormPresentation(isMobile ? "drawer" : "sheet");
    setSubView("main");
    setShowForm(true);
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error("Prix invalide");
      return;
    }

    setSaving(true);
    const payload = {
      category_id: activeTab,
      name: form.name.trim(),
      description: form.description || null,
      price,
      image_url: form.imageUrl,
      tags: form.tags,
      is_available: true,
      display_order: editingProduct?.display_order ?? activeProducts.length,
    };

    if (isPreview) {
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...payload,
                  tags: form.tags,
                }
              : p
          )
        );
      } else {
        const row: ProductItem = {
          id: `preview-prod-${crypto.randomUUID()}`,
          category_id: activeTab,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          image_url: form.imageUrl,
          tags: form.tags,
          is_available: true,
          display_order: payload.display_order,
        };
        setProducts((prev) => [...prev, row]);
      }
      setSaving(false);
      toast.success(
        editingProduct ? "Produit mis à jour (simulation) !" : "Produit ajouté (simulation) !"
      );
      closeForm();
      notify();
      return;
    }

    if (editingProduct) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] }
            : p
        )
      );
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setProducts((prev) => [
        ...prev,
        { ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] },
      ]);
    }

    toast.success(
      editingProduct ? "Produit mis à jour !" : "Produit ajouté ! Top votre carte prend forme !"
    );
    closeForm();
    notify();
  }

  async function deleteProduct(id: string) {
    if (isPreview) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      notify();
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    notify();
  }

  const formFooter = (
    <div className="sticky bottom-0 mt-auto border-t border-border bg-background py-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" type="button" onClick={closeForm} className="flex-1">
          Annuler
        </Button>
        <Button
          type="button"
          onClick={() => void saveProduct()}
          disabled={saving}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className="text-white hover:opacity-90 flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingProduct ? (
            "Enregistrer"
          ) : (
            "Ajouter"
          )}
        </Button>
      </div>
    </div>
  );

  const allergensPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 pb-3">
        <TagSelector selected={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
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

  const photoPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 pb-4">
        <ImageUploader
          bucket="product-images"
          label="Photo du produit"
          currentUrl={form.imageUrl}
          onUpload={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          onRemove={() => setForm((f) => ({ ...f, imageUrl: null }))}
          simulationDisabled={isPreview}
        />
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

  const productFormPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          Catégorie : {activeCategory?.icon_emoji} {activeCategory?.name}
        </p>

        <div className="space-y-1.5">
          <Label>
            Nom du produit <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Ramen tonkotsu"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Prix (€) <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Décrivez brièvement votre produit"
            rows={2}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("photo")}
          className="h-12 w-full justify-between rounded-xl px-3 text-base"
        >
          <span className="flex items-center gap-2">
            {form.imageUrl ? (
              <span className="relative h-7 w-7 overflow-hidden rounded-md border border-border shrink-0">
                <Image src={form.imageUrl} alt="Aperçu photo produit" fill className="object-cover" sizes="28px" />
              </span>
            ) : (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted shrink-0">
                <Camera className="h-4 w-4 text-muted-foreground" />
              </span>
            )}
            {form.imageUrl ? "Modifier la photo du produit" : "Ajouter une photo du produit"}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("tags")}
          className="h-12 w-full justify-between rounded-xl px-3 text-base"
        >
          <span>Allergènes et labels</span>
          <span className="flex items-center gap-2">
            <Badge variant="secondary" className="h-7 min-w-7 rounded-full px-2 text-xs tabular-nums">
              {form.tags.length}
            </Badge>
            <ChevronRight className="h-4 w-4" />
          </span>
        </Button>
      </div>
      {formFooter}
    </div>
  );

  const panelTitle =
    subView === "photo"
      ? "Photo du produit"
      : subView === "tags"
        ? "Allergènes et labels"
        : editingProduct
          ? "Modifier le produit"
          : "Nouveau produit";

  const panelBody = subView === "photo" ? photoPanel : subView === "tags" ? allergensPanel : productFormPanel;

  return (
    <div className="space-y-5 pt-2">
      <OnboardingStepTitle
        title="Produits"
        subtitle="Ajoutez des plats par catégorie : ils apparaissent tout de suite sur l’aperçu de votre vitrine."
      />

      {categories.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === cat.id
                  ? "bg-[var(--color-bento-accent)] text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{cat.icon_emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {activeProducts.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-12 w-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-bento-accent)" }}>
                {product.price.toFixed(2)}&nbsp;€
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openEditForm(product)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Modifier"
              >
                <X className="h-4 w-4 rotate-0" />
              </button>
              <button
                type="button"
                onClick={() => void deleteProduct(product.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openNewForm}
          disabled={!activeTab}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--color-bento-accent)] hover:text-[var(--color-bento-accent)] transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Nouveau produit
        </button>
      </div>

      {!isPreview && (
        <MenuImportButton
          shopId={shopId}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          onImported={() => {
            router.refresh();
            notify();
          }}
        />
      )}
      {isPreview && (
        <p className="text-xs text-muted-foreground text-center">
          Import menu masqué en mode simulation.
        </p>
      )}

      {parentUsesDrawer ? (
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
              <DrawerTitle>{panelTitle}</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">{panelBody}</div>
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
              <SheetTitle>{panelTitle}</SheetTitle>
            </SheetHeader>
            <div className="h-full min-h-0 overflow-y-auto px-4 pb-4">{panelBody}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
