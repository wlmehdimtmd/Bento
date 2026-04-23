"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

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
  const updateItemOptionValue = useCartStore((s) => s.updateItemOptionValue);
  const updateItemSpecialNote = useCartStore((s) => s.updateItemSpecialNote);
  const [isEditingOption, setIsEditingOption] = useState(false);
  const [optionDraft, setOptionDraft] = useState(item.optionValue ?? "");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.specialNote ?? "");
  const bundleSteps = item.isBundle && item.specialNote ? parseBundle(item.specialNote) : null;
  const allergenTags = (item.tags ?? []).filter((t) => ALLERGENS.some((a) => a.value === t));
  const optionChoices = Array.isArray(item.optionChoices)
    ? item.optionChoices.filter((choice) => choice.trim().length > 0)
    : [];
  const optionText =
    item.optionValue && item.optionValue.trim().length > 0
      ? item.optionPriceDelta && item.optionPriceDelta > 0
        ? `${item.optionValue} (+${formatPrice(item.optionPriceDelta)})`
        : item.optionValue
      : null;

  function handleRemove() {
    removeItem(item.id);
    onBack();
    toast.success(locale === "en" ? `${item.name} removed from cart.` : `${item.name} retiré du panier.`);
  }

  function handleSaveNote() {
    updateItemSpecialNote(item.id, noteDraft);
    setIsEditingNote(false);
    toast.success(
      locale === "en"
        ? noteDraft.trim().length > 0
          ? "Note updated."
          : "Note removed."
        : noteDraft.trim().length > 0
          ? "Note mise a jour."
          : "Note supprimee."
    );
  }

  function handleSaveOption() {
    updateItemOptionValue(item.id, optionDraft);
    setIsEditingOption(false);
    toast.success(
      locale === "en"
        ? optionDraft.trim().length > 0
          ? "Option updated."
          : "Option removed."
        : optionDraft.trim().length > 0
          ? "Option mise a jour."
          : "Option supprimee."
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
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
            {optionText && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {locale === "en" ? "Option" : "Option"}
                </p>
                <p className="text-sm">{optionText}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {locale === "en" ? "Edit option" : "Modifier l'option"}
                </p>
                {!isEditingOption ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsEditingOption(true)}
                  >
                    {locale === "en" ? "Edit" : "Modifier"}
                  </Button>
                ) : null}
              </div>

              {isEditingOption ? (
                <div className="mt-2 space-y-2">
                  {optionChoices.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {optionChoices.map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setOptionDraft(choice)}
                          className={
                            optionDraft.trim().toLowerCase() === choice.trim().toLowerCase()
                              ? "inline-flex min-h-10 items-center rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                              : "inline-flex min-h-10 items-center rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                          }
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {locale === "en"
                        ? "No predefined options available for this item."
                        : "Aucune option prédéfinie disponible pour cet article."}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingOption(false)}>
                      {locale === "en" ? "Cancel" : "Annuler"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptionDraft("")}>
                      {locale === "en" ? "Remove option" : "Supprimer l'option"}
                    </Button>
                    <Button type="button" size="sm" onClick={handleSaveOption}>
                      {locale === "en" ? "Save" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {optionText
                    ? optionText
                    : locale === "en"
                      ? "No option selected."
                      : "Aucune option sélectionnée."}
                </p>
              )}
            </div>
            {item.specialNote && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {locale === "en" ? "Note" : "Note"}
                </p>
                <p className="text-sm italic text-muted-foreground">{item.specialNote}</p>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {locale === "en" ? "Edit note" : "Modifier la note"}
                </p>
                {!isEditingNote ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsEditingNote(true)}
                  >
                    {locale === "en" ? "Edit" : "Modifier"}
                  </Button>
                ) : null}
              </div>

              {isEditingNote ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    placeholder={
                      locale === "en"
                        ? "Special instructions..."
                        : "Instructions speciales..."
                    }
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingNote(false)}>
                      {locale === "en" ? "Cancel" : "Annuler"}
                    </Button>
                    <Button type="button" size="sm" onClick={handleSaveNote}>
                      {locale === "en" ? "Save" : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground italic">
                  {item.specialNote?.trim()
                    ? item.specialNote
                    : locale === "en"
                      ? "No note added."
                      : "Aucune note ajoutee."}
                </p>
              )}
            </div>
          </>
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{locale === "en" ? "Quantity" : "Quantité"}</span>
          <span className="font-semibold">{item.quantity} × {formatPrice(item.price)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border shrink-0 space-y-2">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2 className="h-4 w-4" />
          {locale === "en" ? "Remove from cart" : "Retirer du panier"}
        </Button>
        <Button variant="secondary" className="w-full" onClick={onBack}>
          {locale === "en" ? "Back to cart" : "Retour au panier"}
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
  const { t, locale } = useLocale();
  const { open, closeDrawer } = useCartDrawer();
  const isMobile = useIsMobile();

  const headerTitle = (
    <div className="flex items-center gap-2">
      <ShoppingBag
        className="h-4 w-4"
        style={{ color: "var(--primary)" }}
      />
      {t("cart.title")}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => { if (!o) closeDrawer(); }}>
        <DrawerContent className="mt-0 flex h-[100dvh] max-h-[100dvh] flex-col rounded-none border-0 p-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] [&>div:first-child]:hidden">
          <DrawerHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 pb-3 pt-4 text-left shrink-0">
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={locale === "en" ? "Close cart" : "Fermer le panier"}
            >
              <X className="h-4 w-4" />
            </button>
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
        className="data-[side=right]:right-0 data-[side=right]:mr-0 data-[side=right]:translate-x-0 w-full sm:max-w-sm flex flex-col p-0"
        style={{ right: 0, marginRight: 0 }}
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
