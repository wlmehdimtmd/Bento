"use client";

import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";
import { usePublicShop } from "@/components/shop/PublicShopContext";
import { STOREFRONT_CART_CTA_CLASSNAME } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export function CartButton() {
  const { t } = useLocale();
  const { isDemoMode } = usePublicShop();
  const count = useCartStore((s) => s.getCount());
  const total = useCartStore((s) => s.getTotal());
  const { openDrawer } = useCartDrawer();

  const label = `${t("cart.seeCart")}, ${count} ${t("cart.itemsLabel")}, ${t("cart.total").toLowerCase()} ${formatPrice(total)}`;

  const countBadgeClass = isDemoMode
    ? "bg-white text-[10px] font-bold text-neutral-950 ring-1 ring-black/10"
    : "bg-white text-[10px] font-bold text-neutral-950 ring-1 ring-black/10 dark:bg-neutral-900 dark:text-white dark:ring-white/25";

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
          <div className="pointer-events-auto w-max max-w-[min(100%,416px)]">
            <div
              className={cn(
                "flex items-center gap-4 rounded-full bg-white/90 p-1 pr-4 shadow-xl backdrop-blur-[4px]",
                "active:scale-[0.98] motion-safe:transition-transform"
              )}
            >
              <button
                type="button"
                onClick={openDrawer}
                className={cn(STOREFRONT_CART_CTA_CLASSNAME, "shrink-0")}
                aria-label={label}
              >
                <div className="relative shrink-0">
                  <ShoppingBag className="h-5 w-5" />
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full",
                      countBadgeClass
                    )}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                </div>
                <span className="font-semibold whitespace-nowrap">{t("cart.seeCart")}</span>
              </button>
              <span className="flex min-h-11 items-center text-sm font-bold tabular-nums text-neutral-900">
                {formatPrice(total)}
              </span>
            </div>
            <div className="mt-2 flex justify-center">
              <LocaleSwitcher />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
