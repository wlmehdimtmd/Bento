"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { motion } from "framer-motion";
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
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TagBadge } from "@/components/product/TagBadge";
import { PriceTag } from "@/components/product/PriceTag";
import { useCartStore } from "@/lib/stores/cartStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatPrice } from "@/lib/utils";
import type { ProductLabelOption } from "@/lib/shop-labels";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ── Types ──────────────────────────────────────────────────────

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  fallback_emoji?: string;
  tags: string[];
  option_label: string | null;
  option_mode?: "none" | "free" | "paid";
  option_choices?: string[];
  option_price_delta?: number;
  is_available: boolean;
}

interface ProductDetailProps {
  product: PublicProduct | null;
  open: boolean;
  onClose: () => void;
  shopLabels?: ProductLabelOption[];
}

// ── Shared content ─────────────────────────────────────────────

interface ContentProps {
  product: PublicProduct;
  onClose: () => void;
  isMobile?: boolean;
  /** Mobile drawer : zone centrale scrollable + barre d’actions fixe en bas */
  stickyActionBar?: boolean;
  shopLabels?: ProductLabelOption[];
}

function ProductDetailContent({
  product,
  onClose,
  isMobile,
  stickyActionBar,
  shopLabels,
}: ContentProps) {
  const { locale } = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [optionValue, setOptionValue] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [detailDrawer, setDetailDrawer] = useState<"option" | "note" | null>(null);
  const hasProductOption =
    product.option_mode === "free" ||
    product.option_mode === "paid" ||
    Boolean(product.option_label) ||
    (Array.isArray(product.option_choices) && product.option_choices.length > 0);
  const optionChoices = Array.isArray(product.option_choices)
    ? product.option_choices.filter((choice) => choice.trim().length > 0)
    : [];
  const optionSurcharge =
    product.option_mode === "paid" ? Math.max(0, Number(product.option_price_delta ?? 0)) : 0;

  const selectedOptionValue = optionValue.trim();
  const appliedOptionSurcharge =
    hasProductOption && selectedOptionValue && optionSurcharge > 0 ? optionSurcharge : 0;
  const unitPriceWithOption = product.price + appliedOptionSurcharge;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: unitPriceWithOption,
      quantity,
      imageUrl: product.image_url,
      fallbackEmoji: product.fallback_emoji,
      description: product.description,
      tags: product.tags,
      optionChoices,
      optionPriceDelta: optionSurcharge,
      optionValue:
        selectedOptionValue.length > 0 ? selectedOptionValue : undefined,
      specialNote: specialNote.trim() || undefined,
      isBundle: false,
    });
    toast.success(
      locale === "en"
        ? `${quantity}× ${product.name} added to cart!`
        : `${quantity}× ${product.name} ajouté${quantity > 1 ? "s" : ""} au panier !`
    );
    onClose();
  }

  const lineTotal = unitPriceWithOption * quantity;

  const titleEl = isMobile ? (
    <DrawerTitle
      className="text-xl font-bold leading-tight"
      style={{ fontFamily: "var(--font-onest)" }}
    >
      {product.name}
    </DrawerTitle>
  ) : (
    <DialogTitle
      className="text-xl font-bold leading-tight"
      style={{ fontFamily: "var(--font-onest)" }}
    >
      {product.name}
    </DialogTitle>
  );

  const descriptionEl =
    product.description &&
    (isMobile ? (
      <DrawerDescription className="text-sm text-muted-foreground leading-relaxed">
        {product.description}
      </DrawerDescription>
    ) : (
      <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
        {product.description}
      </DialogDescription>
    ));

  const optionNoteBlock = (
    <div className="space-y-3">
      {hasProductOption && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full flex-col items-stretch gap-0.5 py-3 px-4 text-left font-normal"
            onClick={() => setDetailDrawer("option")}
          >
            <span className="text-sm font-semibold text-foreground">
              {optionValue.trim()
                ? locale === "en" ? "Preference added" : "Préférence indiquée"
                : locale === "en" ? "Add a preference" : "Préciser une préférence"}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {optionValue.trim()
                ? optionValue.trim()
                : product.option_label ||
                  (locale === "en" ? "Select an option" : "Sélectionnez une option")}
              {optionSurcharge > 0 ? ` • +${formatPrice(optionSurcharge)}` : ""}
            </span>
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full flex-col items-stretch gap-0.5 py-3 px-4 text-left font-normal"
          onClick={() => setDetailDrawer("note")}
        >
          <span className="text-sm font-semibold text-foreground">
            {specialNote.trim()
              ? locale === "en" ? "Note added" : "Note ajoutée"
              : locale === "en" ? "Add a note" : "Ajouter une note"}
          </span>
          <span className="text-xs text-muted-foreground line-clamp-2">
            {specialNote.trim()
              ? specialNote.trim()
              : locale === "en"
                ? "Instructions for the restaurant (optional)"
                : "Instructions pour le restaurant (facultatif)"}
          </span>
        </Button>
      </div>
    </div>
  );

  const imageBlock = (
    <div
      className="relative w-full shrink-0 overflow-hidden bg-muted/50 flex items-center justify-center"
      style={{ aspectRatio: "4/3" }}
    >
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 480px"
        />
      ) : (
        <span className="text-7xl select-none">{product.fallback_emoji ?? "🍽️"}</span>
      )}
    </div>
  );

  const metaBlock = (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{titleEl}</div>
        <PriceTag price={product.price} size="lg" className="shrink-0" />
      </div>

      {descriptionEl}

      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((t) => (
            <TagBadge key={t} value={t} size="md" labels={shopLabels} />
          ))}
        </div>
      )}

      <Separator />

      {optionNoteBlock}
    </div>
  );

  const actionBar = (
    <div
      className={
        stickyActionBar
          ? "flex flex-col items-stretch gap-3 border-t border-border bg-popover px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          : "flex items-center gap-3 px-5 pb-5 pt-1"
      }
    >
      <div
        className={
          stickyActionBar
            ? "flex w-fit items-center gap-1 self-start rounded-lg border border-border px-1 py-0.5"
            : "flex items-center gap-1 rounded-lg border border-border px-1 py-0.5"
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-bold tabular-nums">
          {quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          disabled={quantity >= 20}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button
        className={stickyActionBar ? "min-h-11 w-full gap-2 font-semibold hover:opacity-90" : "min-h-11 flex-1 gap-2 font-semibold hover:opacity-90"}
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
        onClick={handleAdd}
        disabled={!product.is_available}
      >
        <ShoppingCart className="h-4 w-4 shrink-0" />
        <span>{locale === "en" ? "Add to cart" : "Ajouter au panier"}</span>
        <span className="ml-auto tabular-nums">{formatPrice(lineTotal)}</span>
      </Button>
    </div>
  );

  if (stickyActionBar) {
    return (
      <motion.div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {imageBlock}
          {metaBlock}
        </div>
        {actionBar}

        {detailDrawer && (
          <Drawer open onOpenChange={(open) => { if (!open) setDetailDrawer(null); }}>
            <DrawerContent className="mt-0 flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none border-0 p-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] [&>div:first-child]:hidden">
              <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <DrawerTitle className="text-base font-semibold">
                      {detailDrawer === "option"
                        ? locale === "en"
                          ? "Choose an option"
                          : "Choisir une option"
                        : locale === "en"
                          ? "Add a note"
                          : "Ajouter une note"}
                    </DrawerTitle>
                    <DrawerDescription className="text-xs text-muted-foreground">
                      {detailDrawer === "option"
                        ? `${product.option_label || (locale === "en" ? "Customer option" : "Option client")}${optionSurcharge > 0 ? ` • +${formatPrice(optionSurcharge)}` : ""}`
                        : locale === "en"
                          ? "Instructions for the restaurant (optional)"
                          : "Instructions pour le restaurant (facultatif)"}
                    </DrawerDescription>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDetailDrawer(null)} aria-label={locale === "en" ? "Close" : "Fermer"}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {detailDrawer === "option" ? (
                  <div className="space-y-4">
                    {optionChoices.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {locale === "en" ? "Suggested answers" : "Réponses proposées"}
                        </p>
                        {optionSurcharge > 0 && (
                          <p className="text-sm font-medium text-foreground">
                            {locale === "en"
                              ? `Option surcharge: +${formatPrice(optionSurcharge)}`
                              : `Supplément option : +${formatPrice(optionSurcharge)}`}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {optionChoices.map((choice) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => setOptionValue(choice)}
                              className={
                                optionValue.trim().toLowerCase() === choice.trim().toLowerCase()
                                  ? "inline-flex min-h-10 items-center rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                                  : "inline-flex min-h-10 items-center rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                              }
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {optionChoices.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {locale === "en"
                          ? "No predefined choices are available for this option."
                          : "Aucun choix prédéfini n'est disponible pour cette option."}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="pd-note">{locale === "en" ? "Your note" : "Votre note"}</Label>
                    <Textarea
                      id="pd-note"
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      placeholder={locale === "en" ? "Special instructions..." : "Instructions spéciales…"}
                      rows={5}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3">
                <Button
                  type="button"
                  className="h-11 w-full"
                  onClick={() => setDetailDrawer(null)}
                >
                  {locale === "en" ? "Confirm" : "Valider"}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {imageBlock}
      {metaBlock}
      {actionBar}
    </motion.div>
  );
}

// ── Root component ─────────────────────────────────────────────

export function ProductDetail({ product, open, onClose, shopLabels }: ProductDetailProps) {
  const { locale } = useLocale();
  const isMobile = useIsMobile();

  if (!product) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent className="mt-0 flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none border-0 p-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] [&>div:first-child]:hidden">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label={locale === "en" ? "Close" : "Fermer"}
          >
            <X className="h-4 w-4" />
          </button>
          <ProductDetailContent
            key={product.id}
            product={product}
            onClose={onClose}
            isMobile
            stickyActionBar
            shopLabels={shopLabels}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        showCloseButton={false}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label={locale === "en" ? "Close" : "Fermer"}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[85vh] overflow-y-auto">
          <ProductDetailContent
            key={product.id}
            product={product}
            onClose={onClose}
            shopLabels={shopLabels}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
