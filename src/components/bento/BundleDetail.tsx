"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/product/TagBadge";
import { useCartStore } from "@/lib/stores/cartStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatPrice } from "@/lib/utils";
import { ALLERGENS } from "@/lib/constants";
import type { BundleInfo } from "@/components/bento/StoreView";
import type { PublicProduct } from "@/components/product/ProductDetail";
import type { ProductLabelOption } from "@/lib/shop-labels";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface BundleDetailProps {
  bundle: BundleInfo | null;
  open: boolean;
  onClose: () => void;
  loadCategoryProducts: (categoryId: string) => Promise<PublicProduct[]>;
  shopLabels?: ProductLabelOption[];
}

type Selections = Record<number, PublicProduct[]>;

// ── Inner content (keyed by bundle.id to reset state on change) ─

function BundleDetailContent({
  bundle,
  onClose,
  loadCategoryProducts,
  showInlineClose = false,
}: {
  bundle: BundleInfo;
  onClose: () => void;
  loadCategoryProducts: (categoryId: string) => Promise<PublicProduct[]>;
  showInlineClose?: boolean;
}) {
  const { locale } = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const totalSteps = bundle.slots.length;
  const currentSlot = bundle.slots[step];

  useEffect(() => {
    if (!currentSlot?.categoryId) return;
    queueMicrotask(() => {
      setLoading(true);
      setProducts([]);
      setExpandedProductId(null);
    });
    loadCategoryProducts(currentSlot.categoryId).then((p) => {
      const hide = new Set(currentSlot.excludedProductIds ?? []);
      setProducts(p.filter((x) => !hide.has(x.id)));
      setLoading(false);
    });
  }, [step, currentSlot?.categoryId, currentSlot?.excludedProductIds, loadCategoryProducts]);

  function toggleProduct(product: PublicProduct) {
    const current = selections[step] ?? [];
    const isSelected = current.some((p) => p.id === product.id);
    const maxQty = currentSlot.quantity;

    if (isSelected) {
      setSelections((s) => ({ ...s, [step]: current.filter((p) => p.id !== product.id) }));
    } else if (current.length < maxQty) {
      setSelections((s) => ({ ...s, [step]: [...current, product] }));
    } else if (maxQty === 1) {
      // Replace single selection
      setSelections((s) => ({ ...s, [step]: [product] }));
    }
  }

  const stepSelections = selections[step] ?? [];
  const stepComplete = stepSelections.length >= (currentSlot?.quantity ?? 1);
  const allComplete = bundle.slots.every(
    (slot, i) => (selections[i]?.length ?? 0) >= slot.quantity
  );

  function handleAddToCart() {
    const note = bundle.slots
      .map((slot, i) => {
        const picked = selections[i] ?? [];
        return `${slot.label || slot.categoryName}: ${picked.map((p) => p.name).join(", ")}`;
      })
      .join(" · ");

    const bundleSelections = bundle.slots.map((slot, i) => ({
      label: slot.label || slot.categoryName,
      products: (selections[i] ?? []).map((p) => ({
        name: p.name,
        description: p.description,
      })),
    }));

    addItem({
      productId: bundle.id,
      name: bundle.name,
      price: bundle.price,
      quantity: 1,
      imageUrl: bundle.image_url,
      description: bundle.description,
      tags: [],
      isBundle: true,
      bundleId: bundle.id,
      specialNote: note,
      bundleSelections,
    });
    toast.success(
      locale === "en" ? `${bundle.name} added to cart!` : `${bundle.name} ajouté au panier !`
    );
    onClose();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header: title + price + step indicators ── */}
      <div className="px-5 pt-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              {locale === "en" ? "Bundle" : "Formule"}
            </p>
            <h2
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              {bundle.name}
            </h2>
            {bundle.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{bundle.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black tabular-nums text-foreground">
              {formatPrice(bundle.price)}
            </span>
            {showInlineClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="shrink-0"
                aria-label={locale === "en" ? "Close" : "Fermer"}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Step progress pills */}
        <div className="flex items-stretch gap-1.5">
          {bundle.slots.map((slot, i) => {
            const done = (selections[i]?.length ?? 0) >= slot.quantity;
            const active = i === step;
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex-1 flex flex-col items-center gap-1 rounded-xl p-2 transition-colors ${
                  active
                    ? "bg-[var(--primary)]/10"
                    : "hover:bg-muted/60"
                }`}
              >
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : active
                      ? "border-2 border-[var(--primary)] text-[var(--primary)]"
                      : "border-2 border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] font-medium leading-none truncate max-w-full ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {slot.label || slot.categoryName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step label ── */}
      <div className="px-5 py-3 shrink-0">
        <p className="text-sm font-semibold">
          <span className="text-muted-foreground">
            {locale === "en" ? "Step" : "Étape"} {step + 1}/{totalSteps} —
          </span>{" "}
          {currentSlot?.quantity === 1
            ? `Choisissez votre ${(currentSlot.label || currentSlot.categoryName).toLowerCase()} ${currentSlot.categoryEmoji}`
            : `Choisissez ${currentSlot?.quantity} × ${(currentSlot?.label || currentSlot?.categoryName || "").toLowerCase()} ${currentSlot?.categoryEmoji}`}
        </p>
      </div>

      {/* ── Products ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            {locale === "en" ? "Loading products..." : "Chargement des produits…"}
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            {locale === "en" ? "No product available for this step." : "Aucun produit disponible pour cette étape."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {products.map((product) => {
              const isSelected = stepSelections.some((p) => p.id === product.id);
              const allergenTags = (product.tags ?? []).filter((t) =>
                ALLERGENS.some((a) => a.value === t)
              );
              const isExpanded = expandedProductId === product.id;
              const hasDetail = !!(product.description || allergenTags.length > 0);
              return (
                <div
                  key={product.id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                      : "border-border"
                  }`}
                >
                  {/* ── Selectable row ── */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleProduct(product)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleProduct(product);
                      }
                    }}
                    className="flex items-center gap-3 p-3 cursor-pointer rounded-xl hover:bg-muted/20 transition-colors"
                  >
                    {/* Image — 56px mobile, 80px md+ */}
                    {product.image_url ? (
                      <div className="relative h-14 w-14 md:h-20 md:w-20 shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 56px, 80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 md:h-20 md:w-20 shrink-0 rounded-lg bg-muted flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm leading-snug"
                        style={{ fontFamily: "var(--font-onest)" }}
                      >
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      )}
                      {/* Allergens */}
                      {allergenTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {allergenTags.map((t) => (
                            <TagBadge key={t} value={t} size="sm" />
                          ))}
                        </div>
                      )}
                      {/* Price — mobile only */}
                      <p className="text-xs font-bold text-foreground mt-1 tabular-nums md:hidden">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Price — desktop only */}
                    <p className="hidden md:block text-sm font-bold text-foreground tabular-nums shrink-0 mx-2">
                      {formatPrice(product.price)}
                    </p>

                    {/* Checkmark */}
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "border-2 border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>

                  {/* ── "Voir le détail" toggle ── */}
                  {hasDetail && (
                    <div className="px-3 pb-2 border-t border-border/40">
                      <button
                        onClick={() =>
                          setExpandedProductId(isExpanded ? null : product.id)
                        }
                        className="flex items-center gap-1 pt-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded
                          ? locale === "en" ? "Hide details" : "Masquer le détail"
                          : locale === "en" ? "View details" : "Voir le détail"}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  )}

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <div className="px-3 pb-4 pt-1 space-y-3 border-t border-border/40">
                      {product.image_url && (
                        <div className="relative h-36 w-full rounded-lg overflow-hidden">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 90vw, 640px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      {product.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      {allergenTags.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                            {locale === "en" ? "Allergens" : "Allergènes"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {allergenTags.map((t) => (
                              <TagBadge key={t} value={t} size="md" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer navigation ── */}
      <div className="px-5 py-4 border-t border-border shrink-0 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{locale === "en" ? "Previous" : "Précédent"}</span>
        </Button>

        <div className="flex-1" />

        {step < totalSteps - 1 ? (
          <Button
            size="sm"
            onClick={() => setStep((s) => s + 1)}
            disabled={!stepComplete}
            className="gap-1 hover:opacity-90"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {locale === "en" ? "Next" : "Suivant"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!allComplete}
            className="gap-1.5 hover:opacity-90"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            {locale === "en" ? "Add to cart" : "Ajouter au panier"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Public export ───────────────────────────────────────────────

export function BundleDetail({
  bundle,
  open,
  onClose,
  loadCategoryProducts,
  shopLabels: _shopLabels,
}: BundleDetailProps) {
  const { locale } = useLocale();
  const isMobile = useIsMobile();

  if (!bundle) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent className="flex flex-col h-[92vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{bundle.name}</DrawerTitle>
            <DrawerDescription>
              {locale === "en" ? "Build your bundle step by step" : "Composez votre formule étape par étape"}
            </DrawerDescription>
          </DrawerHeader>
          <BundleDetailContent
            key={bundle.id}
            bundle={bundle}
            onClose={onClose}
            loadCategoryProducts={loadCategoryProducts}
            showInlineClose={false}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">{bundle.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {locale === "en" ? "Build your bundle step by step" : "Composez votre formule étape par étape"}
        </DialogDescription>
        <BundleDetailContent
          key={bundle.id}
          bundle={bundle}
          onClose={onClose}
          loadCategoryProducts={loadCategoryProducts}
          showInlineClose
        />
      </DialogContent>
    </Dialog>
  );
}
