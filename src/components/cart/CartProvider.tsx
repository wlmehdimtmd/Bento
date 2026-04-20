"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/stores/cartStore";

interface CartProviderProps {
  shopSlug: string;
  children: React.ReactNode;
}

export function CartProvider({ shopSlug, children }: CartProviderProps) {
  const initCart = useCartStore((s) => s.initCart);

  useEffect(() => {
    initCart(shopSlug);
  }, [shopSlug, initCart]);

  return <>{children}</>;
}
