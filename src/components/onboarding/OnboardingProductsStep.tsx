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
import { DEFAULT_PRODUCT_LABELS } from "@/lib/shop-labels";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { MenuImportButton } from "@/components/onboarding/MenuImportButton";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

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
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
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
      toast.error(tr("Le nom est requis", "Name is required"));
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error(tr("Prix invalide", "Invalid price"));
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
        editingProduct ? tr("Produit mis à jour (simulation) !", "Product updated (preview)!") : tr("Produit ajouté (simulation) !", "Product added (preview)!")
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
      editingProduct ? tr("Produit mis à jour !", "Product updated!") : tr("Produit ajouté ! Top votre carte prend forme !", "Product added! Your menu is taking shape!")
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
    <div className="sticky bottom-0 mt-auto border-t border-border py-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" type="button" onClick={closeForm} className="flex-1">
          {tr("Annuler", "Cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => void saveProduct()}
          disabled={saving}
          style={{ backgroundColor: "var(--primary)" }}
          className="text-primary-foreground hover:opacity-90 flex-1"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingProduct ? (
            tr("Enregistrer", "Save")
          ) : (
            tr("Ajouter", "Add")
          )}
        </Button>
      </div>
    </div>
  );

  const allergensPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 pb-3">
        <TagSelector
          selected={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          labels={DEFAULT_PRODUCT_LABELS}
        />
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

  const photoPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 pb-4">
        {form.name.trim() ? (
          <p className="mb-3 text-sm text-muted-foreground">
            {tr("Produit", "Product")} : <span className="font-medium text-foreground">{form.name.trim()}</span>
          </p>
        ) : null}
        <ImageUploader
          bucket="product-images"
          label={tr("Photo du produit", "Product photo")}
          currentUrl={form.imageUrl}
          onUpload={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          onRemove={() => setForm((f) => ({ ...f, imageUrl: null }))}
          simulationDisabled={isPreview}
        />
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

  const productFormPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">
          {tr("Catégorie", "Category")} : {activeCategory?.icon_emoji} {activeCategory?.name}
        </p>

        <div className="space-y-1.5">
          <Label>
            {tr("Nom du produit", "Product name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={tr("Ex: Ramen tonkotsu", "Ex: Tonkotsu ramen")}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            {tr("Prix (€)", "Price (€)")} <span className="text-destructive">*</span>
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
          <Label>{tr("Description", "Description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={tr("Décrivez brièvement votre produit", "Briefly describe your product")}
            rows={2}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("photo")}
          className="h-14 w-full justify-between rounded-xl px-3 text-base"
        >
          <span className="flex items-center gap-2">
            <span className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-muted shrink-0">
              {form.imageUrl ? (
                <Image src={form.imageUrl} alt={tr("Aperçu photo produit", "Product photo preview")} fill className="object-cover" sizes="40px" />
              ) : (
                <span className="inline-flex h-full w-full items-center justify-center">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </span>
              )}
            </span>
            {form.imageUrl ? tr("Modifier la photo", "Edit photo") : tr("Ajouter une photo", "Add photo")}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("tags")}
          className="h-12 w-full justify-between rounded-xl px-3 text-base"
        >
          <span>{tr("Allergènes et labels", "Allergens and labels")}</span>
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
      ? tr("Photo du produit", "Product photo")
      : subView === "tags"
        ? tr("Allergènes et labels", "Allergens and labels")
        : editingProduct
          ? tr("Modifier le produit", "Edit product")
          : tr("Nouveau produit", "New product");

  const panelBody = subView === "photo" ? photoPanel : subView === "tags" ? allergensPanel : productFormPanel;

  return (
    <div className="space-y-5 pt-2">
      <OnboardingStepTitle
        title={tr("Produits", "Products")}
        subtitle={tr("Ajoutez des plats par catégorie : ils apparaissent tout de suite sur l’aperçu de votre vitrine.", "Add items by category: they appear immediately in your storefront preview.")}
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
                  ? "bg-[var(--primary)] text-white dark:text-black"
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
              <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                {product.price.toFixed(2)}&nbsp;€
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => openEditForm(product)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={tr("Modifier", "Edit")}
              >
                <X className="h-4 w-4 rotate-0" />
              </button>
              <button
                type="button"
                onClick={() => void deleteProduct(product.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={tr("Supprimer", "Delete")}
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
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {tr("Nouveau produit", "New product")}
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
          {tr("Import menu masqué en mode simulation.", "Menu import hidden in preview mode.")}
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
                  aria-label={tr("Retour", "Back")}
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
                  aria-label={tr("Retour", "Back")}
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
