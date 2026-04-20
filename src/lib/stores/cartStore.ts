import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ──────────────────────────────────────────────────────

export interface BundleStepSelection {
  label: string;
  products: { name: string; description: string | null }[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  description?: string | null;
  tags?: string[];
  optionValue?: string;
  specialNote?: string;
  isBundle: boolean;
  bundleId?: string;
  bundleSelections?: BundleStepSelection[];
}

interface CartState {
  shopSlug: string | null;
  items: CartItem[];

  // Actions
  initCart: (shopSlug: string) => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Selectors (stable references — call as functions)
  getTotal: () => number;
  getCount: () => number;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      shopSlug: null,
      items: [],

      initCart(shopSlug) {
        if (get().shopSlug !== shopSlug) {
          set({ shopSlug, items: [] });
        }
      },

      addItem(item) {
        set((state) => {
          // Safety: clear if shop changed (e.g. deep-link without CartProvider)
          if (state.shopSlug && item.bundleId === undefined) {
            // no-op here — shop guard is in initCart
          }

          // Merge duplicate: same productId + same optionValue (not bundles)
          if (!item.isBundle) {
            const existing = state.items.find(
              (i) =>
                !i.isBundle &&
                i.productId === item.productId &&
                (i.optionValue ?? "") === (item.optionValue ?? "")
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.id === existing.id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                ),
              };
            }
          }

          return { items: [...state.items, { ...item, id: generateId() }] };
        });
      },

      removeItem(id) {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity(id, quantity) {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      getTotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: "bento-cart",
      partialize: (state) => ({ shopSlug: state.shopSlug, items: state.items }),
    }
  )
);
