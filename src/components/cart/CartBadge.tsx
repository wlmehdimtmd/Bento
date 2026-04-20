"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";

export function CartBadge() {
  const count = useCartStore((s) => s.getCount());
  const { openDrawer } = useCartDrawer();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Panier${count > 0 ? ` (${count})` : ""}`}
      className="relative"
      onClick={openDrawer}
    >
      <ShoppingCart className="h-4 w-4" />

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
