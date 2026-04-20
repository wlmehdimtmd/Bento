"use client";

import { createContext, useContext, useState } from "react";

type DrawerView = "cart" | "checkout";

interface CartDrawerContextValue {
  open: boolean;
  view: DrawerView;
  openDrawer: () => void;
  closeDrawer: () => void;
  showCheckout: () => void;
  showCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextValue>({
  open: false,
  view: "cart",
  openDrawer: () => {},
  closeDrawer: () => {},
  showCheckout: () => {},
  showCart: () => {},
});

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DrawerView>("cart");

  function openDrawer() {
    setView("cart");
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
    // Reset to cart view after close animation
    setTimeout(() => setView("cart"), 300);
  }

  return (
    <CartDrawerContext.Provider
      value={{
        open,
        view,
        openDrawer,
        closeDrawer,
        showCheckout: () => setView("checkout"),
        showCart: () => setView("cart"),
      }}
    >
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  return useContext(CartDrawerContext);
}
