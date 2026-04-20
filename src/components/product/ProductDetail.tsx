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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TagBadge } from "@/components/product/TagBadge";
import { PriceTag } from "@/components/product/PriceTag";
import { useCartStore } from "@/lib/stores/cartStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatPrice } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  tags: string[];
  option_label: string | null;
  is_available: boolean;
}

interface ProductDetailProps {
  product: PublicProduct | null;
  open: boolean;
  onClose: () => void;
}

// ── Shared content ─────────────────────────────────────────────

interface ContentProps {
  product: PublicProduct;
  onClose: () => void;
  isMobile?: boolean;
  /** Mobile drawer : zone centrale scrollable + barre d’actions fixe en bas */
  stickyActionBar?: boolean;
}

function ProductDetailContent({
  product,
  onClose,
  isMobile,
  stickyActionBar,
}: ContentProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [optionValue, setOptionValue] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [optionFieldOpen, setOptionFieldOpen] = useState(false);
  const [noteFieldOpen, setNoteFieldOpen] = useState(false);

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.image_url,
      description: product.description,
      tags: product.tags,
      optionValue: optionValue.trim() || undefined,
      specialNote: specialNote.trim() || undefined,
      isBundle: false,
    });
    toast.success(
      `${quantity}× ${product.name} ajouté${quantity > 1 ? "s" : ""} au panier !`
    );
    onClose();
  }

  const lineTotal = product.price * quantity;

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
      {product.option_label && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-11 w-full flex-col items-stretch gap-0.5 py-3 px-4 text-left font-normal"
            onClick={() => setOptionFieldOpen((o) => !o)}
            aria-expanded={optionFieldOpen}
          >
            <span className="text-sm font-semibold text-foreground">
              {optionValue.trim()
                ? "Préférence indiquée"
                : "Préciser une préférence"}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {optionValue.trim() ? optionValue.trim() : product.option_label}
            </span>
          </Button>
          {optionFieldOpen && (
            <div className="space-y-1.5">
              <Label htmlFor="pd-option">{product.option_label}</Label>
              <Input
                id="pd-option"
                value={optionValue}
                onChange={(e) => setOptionValue(e.target.value)}
                placeholder="Votre réponse…"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full flex-col items-stretch gap-0.5 py-3 px-4 text-left font-normal"
          onClick={() => setNoteFieldOpen((o) => !o)}
          aria-expanded={noteFieldOpen}
        >
          <span className="text-sm font-semibold text-foreground">
            {specialNote.trim() ? "Note ajoutée" : "Ajouter une note"}
          </span>
          <span className="text-xs text-muted-foreground line-clamp-2">
            {specialNote.trim()
              ? specialNote.trim()
              : "Instructions pour le restaurant (facultatif)"}
          </span>
        </Button>
        {noteFieldOpen && (
          <div className="space-y-1.5">
            <Label htmlFor="pd-note">Votre note</Label>
            <Textarea
              id="pd-note"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder="Instructions spéciales…"
              rows={3}
            />
          </div>
        )}
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
        <span className="text-7xl select-none">🍽️</span>
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
            <TagBadge key={t} value={t} size="md" />
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
          backgroundColor: "var(--color-bento-accent)",
          color: "var(--color-bento-accent-foreground)",
        }}
        onClick={handleAdd}
        disabled={!product.is_available}
      >
        <ShoppingCart className="h-4 w-4 shrink-0" />
        <span>Ajouter au panier</span>
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

export function ProductDetail({ product, open, onClose }: ProductDetailProps) {
  const isMobile = useIsMobile();

  if (!product) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerContent className="flex h-[92vh] max-h-[92vh] flex-col gap-0 p-0">
          <ProductDetailContent
            key={product.id}
            product={product}
            onClose={onClose}
            isMobile
            stickyActionBar
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
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[85vh] overflow-y-auto">
          <ProductDetailContent key={product.id} product={product} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
