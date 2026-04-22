"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useCartStore, type CartItem } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";
import { CartItemRow } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { TagBadge } from "@/components/product/TagBadge";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ALLERGENS, STOREFRONT_CART_CTA_CLASSNAME } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ── Item review panel ──────────────────────────────────────────

function parseBundle(specialNote: string): { label: string; choice: string }[] {
  return specialNote.split(" · ").flatMap((part) => {
    const idx = part.indexOf(": ");
    if (idx === -1) return [];
    return [{ label: part.slice(0, idx), choice: part.slice(idx + 2) }];
  });
}

function CartItemReview({ item, onBack }: { item: CartItem; onBack: () => void }) {
  const { locale } = useLocale();
  const removeItem = useCartStore((s) => s.removeItem);
  const bundleSteps = item.isBundle && item.specialNote ? parseBundle(item.specialNote) : null;
  const allergenTags = (item.tags ?? []).filter((t) => ALLERGENS.some((a) => a.value === t));

  function handleRemove() {
    removeItem(item.id);
    onBack();
    toast.success(locale === "en" ? `${item.name} removed from cart.` : `${item.name} retiré du panier.`);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Back */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {locale === "en" ? "Back to cart" : "Retour au panier"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Image + name */}
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl">
                {item.isBundle ? "🎁" : (item.fallbackEmoji ?? "🍽️")}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight">{item.name}</p>
            {item.isBundle && (
              <span className="inline-block text-xs font-medium px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] mt-1">
                {locale === "en" ? "Bundle" : "Formule"}
              </span>
            )}
          </div>
          <p className="text-base font-black tabular-nums shrink-0" style={{ color: "var(--primary)" }}>
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <Separator />

        {/* Bundle steps with descriptions */}
        {item.isBundle && item.bundleSelections && item.bundleSelections.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {locale === "en" ? "Composition" : "Composition"}
            </p>
            <div className="space-y-3">
              {item.bundleSelections.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground leading-none mb-1">{s.label}</p>
                    {s.products.map((p, j) => (
                      <div key={j}>
                        <p className="text-sm font-semibold leading-snug">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{p.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fallback: bundle without bundleSelections (legacy) */}
        {item.isBundle && !item.bundleSelections && bundleSteps && bundleSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {locale === "en" ? "Composition" : "Composition"}
            </p>
            <div className="space-y-2">
              {bundleSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground leading-none mb-0.5">{s.label}</p>
                    <p className="text-sm font-semibold leading-snug">{s.choice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product details */}
        {!item.isBundle && (
          <>
            {item.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {locale === "en" ? "Description" : "Description"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
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
            {item.optionValue && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {locale === "en" ? "Option" : "Option"}
                </p>
                <p className="text-sm">{item.optionValue}</p>
              </div>
            )}
            {item.specialNote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {locale === "en" ? "Note" : "Note"}
                </p>
                <p className="text-sm italic text-muted-foreground">{item.specialNote}</p>
              </div>
            )}
          </>
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{locale === "en" ? "Quantity" : "Quantité"}</span>
          <span className="font-semibold">{item.quantity} × {formatPrice(item.price)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2 className="h-4 w-4" />
          {locale === "en" ? "Remove from cart" : "Retirer du panier"}
        </Button>
      </div>
    </div>
  );
}

// ── Cart view ──────────────────────────────────────────────────

interface CartViewProps {
  onClose: () => void;
  onCheckout: () => void;
}

function CartView({ onClose, onCheckout }: CartViewProps) {
  const { t, locale } = useLocale();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const count = useCartStore((s) => s.getCount());
  const total = useCartStore((s) => s.getTotal());
  const [confirmClear, setConfirmClear] = useState(false);
  const [reviewItem, setReviewItem] = useState<CartItem | null>(null);

  function handleClear() {
    clearCart();
    setConfirmClear(false);
    toast.success(locale === "en" ? "Cart cleared." : "Panier vidé.");
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--primary)/10" }}
        >
          <ShoppingBag
            className="h-9 w-9"
            style={{ color: "var(--primary)" }}
          />
        </div>
        <div>
          <p className="font-semibold text-base">{t("cart.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("cart.empty.subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          ← {t("cart.backToMenu")}
        </Button>
      </div>
    );
  }

  if (reviewItem) {
    return (
      <CartItemReview
        item={reviewItem}
        onBack={() => setReviewItem(null)}
      />
    );
  }

  return (
    <>
      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onReview={() => setReviewItem(item)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border bg-background">
        <CartSummary count={count} total={total} />

        <div className="flex justify-center">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{locale === "en" ? "Confirm?" : "Confirmer ?"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClear(false)}
              >
                {locale === "en" ? "Cancel" : "Annuler"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClear}>
                {locale === "en" ? "Clear" : "Vider"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {locale === "en" ? "Clear cart" : "Vider le panier"}
            </Button>
          )}
        </div>

        <button
          type="button"
          className={cn(STOREFRONT_CART_CTA_CLASSNAME, "w-full")}
          onClick={onCheckout}
        >
          <span className="font-semibold">{t("cart.checkout")}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

// ── Animated inner content (cart ↔ checkout) ───────────────────

function DrawerInner({ onClose }: { onClose: () => void }) {
  const { view, showCheckout, showCart } = useCartDrawer();

  return (
    <AnimatePresence mode="wait">
      {view === "cart" ? (
        <motion.div
          key="cart"
          className="flex flex-col flex-1 min-h-0"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CartView onClose={onClose} onCheckout={showCheckout} />
        </motion.div>
      ) : (
        <motion.div
          key="checkout"
          className="flex flex-col flex-1 min-h-0 px-4 pb-4 pt-2"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CheckoutForm onBack={showCart} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Root ───────────────────────────────────────────────────────

export function CartDrawer() {
  const { t } = useLocale();
  const { open, closeDrawer } = useCartDrawer();
  const isMobile = useIsMobile();

  const headerTitle = (
    <div className="flex items-center gap-2">
      <ShoppingCart
        className="h-4 w-4"
        style={{ color: "var(--primary)" }}
      />
      {t("cart.title")}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) closeDrawer(); }}>
        <DrawerContent className="flex flex-col max-h-[92vh]">
          <DrawerHeader className="text-left border-b border-border pb-3 shrink-0">
            <DrawerTitle>{headerTitle}</DrawerTitle>
          </DrawerHeader>
          <DrawerInner onClose={closeDrawer} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) closeDrawer(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm flex flex-col p-0"
        showCloseButton
      >
        <SheetHeader className="px-4 py-4 border-b border-border shrink-0">
          <SheetTitle>{headerTitle}</SheetTitle>
        </SheetHeader>
        <DrawerInner onClose={closeDrawer} />
      </SheetContent>
    </Sheet>
  );
}
