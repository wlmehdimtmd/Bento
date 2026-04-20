"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";
import { usePublicShop } from "@/components/shop/PublicShopContext";
import { ACCENT_CTA_HOVER_OVERLAY_CLASS } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

export function CartButton() {
  const { isDemoMode } = usePublicShop();
  const count = useCartStore((s) => s.getCount());
  const total = useCartStore((s) => s.getTotal());
  const { openDrawer } = useCartDrawer();

  const label = `Voir le panier, ${count} article${count > 1 ? "s" : ""}`;

  const buttonInner = (
    <>
      <div className="relative shrink-0">
        <ShoppingCart className="h-5 w-5" />
        <span
          className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white ring-1 ring-white/35"
        >
          {count > 9 ? "9+" : count}
        </span>
      </div>
      <span className="font-semibold text-sm text-white">Voir le panier</span>
      <span className="ml-1 font-bold tabular-nums text-sm text-white/90">
        — {formatPrice(total)}
      </span>
    </>
  );

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          <div className="pointer-events-auto w-full max-w-[416px]">
            <button
              type="button"
              onClick={openDrawer}
              className={cn(
                "relative flex min-h-[44px] w-full items-center justify-center gap-3 overflow-hidden rounded-lg px-5 py-3 text-sm font-medium text-white shadow-xl active:scale-[0.98]",
                isDemoMode
                  ? "bg-primary transition-opacity hover:opacity-90 dark:bg-[#111111]"
                  : "group bg-[var(--color-bento-accent)] transition-transform"
              )}
              aria-label={label}
            >
              {!isDemoMode && <span aria-hidden className={ACCENT_CTA_HOVER_OVERLAY_CLASS} />}
              {isDemoMode ? (
                buttonInner
              ) : (
                <span className="relative z-[2] flex items-center justify-center gap-3">
                  {buttonInner}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
