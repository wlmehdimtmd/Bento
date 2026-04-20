"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore, type CartItem } from "@/lib/stores/cartStore";
import { formatPrice } from "@/lib/utils";

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

interface OrderData {
  id: string;
  order_number: number;
  total_amount: number;
  fulfillment_mode: string;
  customer_name: string;
  table_number: string | null;
  delivery_address: string | null;
}

interface OrderConfirmationProps {
  order: OrderData;
  shopSlug: string;
}

export function OrderConfirmation({ order, shopSlug }: OrderConfirmationProps) {
  const clearCart = useCartStore((s) => s.clearCart);
  const storeItems = useCartStore((s) => s.items);

  // Capture items before clearing
  const [capturedItems, setCapturedItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setCapturedItems(storeItems.length > 0 ? storeItems : []);
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 py-8 bg-muted/40">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          >
            <CheckCircle2
              className="h-16 w-16"
              style={{ color: "#22c55e" }}
            />
          </motion.div>
          <div className="text-center">
            <h2
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              Commande confirmée !
            </h2>
            <p className="text-muted-foreground mt-1">
              N°{" "}
              <span className="font-bold text-foreground">
                #{String(order.order_number).padStart(4, "0")}
              </span>
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Mode + table/address */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium">
                {FULFILLMENT_LABELS[order.fulfillment_mode] ?? order.fulfillment_mode}
              </span>
            </div>
            {order.table_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table</span>
                <span className="font-medium">#{order.table_number}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Livraison</span>
                <span className="font-medium text-right">{order.delivery_address}</span>
              </div>
            )}
          </div>

          {/* Items recap */}
          {capturedItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Articles commandés
                </p>
                {capturedItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="tabular-nums font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-base">
            <span>Total payé</span>
            <span className="text-foreground">
              {formatPrice(order.total_amount)}
            </span>
          </div>

          {/* CTA */}
          <Link href={`/${shopSlug}`} className="block">
            <Button
              variant="outline"
              className="w-full"
            >
              ← Retour à la boutique
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
