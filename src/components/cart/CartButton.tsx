"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";
import { cn, formatPrice } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

export function CartButton() {
  const isMobile = useIsMobile();
  const count = useCartStore((s) => s.getCount());
  const total = useCartStore((s) => s.getTotal());
  const { openDrawer } = useCartDrawer();

  const buttonInner = (
    <>
      <div className="relative shrink-0">
        <ShoppingCart className="h-5 w-5" />
        <span
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] font-bold text-foreground ring-1 ring-border"
        >
          {count > 9 ? "9+" : count}
        </span>
      </div>
      <span className="font-semibold text-sm">Voir le panier</span>
      <span className="ml-1 font-bold tabular-nums text-sm opacity-90">
        — {formatPrice(total)}
      </span>
    </>
  );

  const label = `Voir le panier, ${count} article${count > 1 ? "s" : ""}`;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className={cn(
            "fixed z-50",
            isMobile
              ? "inset-x-0 bottom-0 border-t border-border/80 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md"
              : "bottom-4 right-4"
          )}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {isMobile ? (
            <div className="mx-auto flex w-full max-w-md justify-center">
              <button
                onClick={openDrawer}
                className="flex w-full max-w-md items-center justify-center gap-3 rounded-2xl px-5 py-3 shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-bento-accent)",
                  color: "var(--color-bento-accent-foreground)",
                }}
                aria-label={label}
              >
                {buttonInner}
              </button>
            </div>
          ) : (
            <button
              onClick={openDrawer}
              className="flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl transition-opacity hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: "var(--color-bento-accent)",
                color: "var(--color-bento-accent-foreground)",
              }}
              aria-label={label}
            >
              {buttonInner}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
