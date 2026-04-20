"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Camera, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { ImageUploader } from "@/components/product/ImageUploader";
import { TagSelector } from "@/components/product/TagSelector";
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
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  function openNewForm() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowPreview(false);
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
    setShowPreview(false);
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
      setShowForm(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      setShowPreview(false);
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
    setShowForm(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowPreview(false);
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
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          setShowForm(false);
          setShowPreview(false);
        }}
        className="flex-1"
      >
        Annuler
      </Button>
      {showPreview ? (
        <>
          <Button variant="outline" type="button" onClick={() => setShowPreview(false)} className="flex-1">
            Modifier
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
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Confirmer
              </>
            )}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          onClick={() => {
            if (!form.name.trim()) {
              toast.error("Le nom est requis");
              return;
            }
            if (!form.price || isNaN(parseFloat(form.price))) {
              toast.error("Le prix est requis");
              return;
            }
            setShowPreview(true);
          }}
          style={{ backgroundColor: "var(--color-bento-accent)" }}
          className="text-white hover:opacity-90 flex-1"
        >
          Prévisualiser
        </Button>
      )}
    </div>
  );

  if (showForm) {
    return (
      <div className="space-y-5 pt-2">
        <div className="space-y-1">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
            {editingProduct ? "Modifier le plat" : "Nouveau plat"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Catégorie : {activeCategory?.icon_emoji} {activeCategory?.name}
          </p>
        </div>

        {showPreview ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt={form.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-muted flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-base">{form.name}</h3>
                <span
                  className="text-base font-bold shrink-0"
                  style={{ color: "var(--color-bento-accent)" }}
                >
                  {parseFloat(form.price || "0").toFixed(2)}&nbsp;€
                </span>
              </div>
              {form.description && (
                <p className="text-sm text-muted-foreground">{form.description}</p>
              )}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs rounded-full px-2 py-0.5 bg-muted text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageUploader
              bucket="product-images"
              label="Photo du produit"
              currentUrl={form.imageUrl}
              onUpload={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              onRemove={() => setForm((f) => ({ ...f, imageUrl: null }))}
              simulationDisabled={isPreview}
            />

            <div className="space-y-1.5">
              <Label>
                Nom du produit <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Croque-Monsieur"
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
                placeholder="4 nigiri, 4 maki, 4 california"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Allergènes</Label>
              <div className="rounded-lg border border-border p-3">
                <TagSelector
                  selected={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              </div>
            </div>
          </div>
        )}
        {formFooter}
      </div>
    );
  }

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
    </div>
  );
}
