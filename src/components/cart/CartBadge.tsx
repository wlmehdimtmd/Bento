"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCartDrawer } from "./CartDrawerContext";

export function CartBadge() {
  const count = useCartStore((s) => s.getCount());
  const { openDrawer } = useCartDrawer();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);

  const displayedCount = hydrated ? count : 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Panier${displayedCount > 0 ? ` (${displayedCount})` : ""}`}
      className="relative text-muted-foreground"
      onClick={openDrawer}
    >
      <ShoppingCart className="h-4 w-4" />

      <AnimatePresence>
        {displayedCount > 0 && (
          <motion.span
            key={displayedCount}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-1 ring-border"
          >
            {displayedCount > 9 ? "9+" : displayedCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
