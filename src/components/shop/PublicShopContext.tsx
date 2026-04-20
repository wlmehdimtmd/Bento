"use client";

import { createContext, useContext } from "react";

export interface PublicShopInfo {
  id: string;
  slug: string;
  name: string;
  stripeAccountId: string | null;
  fulfillmentModes: string[];
  isDemoMode?: boolean;
}

const PublicShopContext = createContext<PublicShopInfo | null>(null);

export function PublicShopProvider({
  shop,
  children,
}: {
  shop: PublicShopInfo;
  children: React.ReactNode;
}) {
  return (
    <PublicShopContext.Provider value={shop}>
      {children}
    </PublicShopContext.Provider>
  );
}

export function usePublicShop(): PublicShopInfo {
  const ctx = useContext(PublicShopContext);
  if (!ctx) throw new Error("usePublicShop must be used inside PublicShopProvider");
  return ctx;
}
