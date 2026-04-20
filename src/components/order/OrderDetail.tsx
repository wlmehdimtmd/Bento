"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "./OrderStatusBadge";
import type { OrderRow } from "./OrderCard";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

interface OrderItemFull {
  id: string;
  order_id: string;
  product_id: string | null;
  bundle_id: string | null;
  quantity: number;
  unit_price: number;
  option_value: string | null;
  special_note: string | null;
  name: string;
}

// ── Helpers ────────────────────────────────────────────────────

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

const ALL_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "preparing", label: "En préparation" },
  { value: "ready", label: "Prête" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

async function fetchItemsWithNames(orderId: string): Promise<OrderItemFull[]> {
  const supabase = createClient();

  const { data: rawItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (!rawItems?.length) return [];

  const productIds = rawItems
    .filter((i) => i.product_id)
    .map((i) => i.product_id!);
  const bundleIds = rawItems
    .filter((i) => i.bundle_id)
    .map((i) => i.bundle_id!);

  const [{ data: products }, { data: bundles }] = await Promise.all([
    productIds.length > 0
      ? supabase.from("products").select("id, name").in("id", productIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    bundleIds.length > 0
      ? supabase.from("bundles").select("id, name").in("id", bundleIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const productMap: Record<string, string> = Object.fromEntries(
    (products ?? []).map((p) => [p.id, p.name])
  );
  const bundleMap: Record<string, string> = Object.fromEntries(
    (bundles ?? []).map((b) => [b.id, b.name])
  );

  return rawItems.map((item) => ({
    ...item,
    name: item.product_id
      ? (productMap[item.product_id] ?? "Produit")
      : item.bundle_id
        ? (bundleMap[item.bundle_id] ?? "Formule")
        : "Produit retiré du catalogue",
  }));
}

// ── Component ──────────────────────────────────────────────────

interface OrderDetailProps {
  order: OrderRow | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

export function OrderDetail({
  order,
  open,
  onClose,
  onStatusChange,
}: OrderDetailProps) {
  const [items, setItems] = useState<OrderItemFull[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    setLoadingItems(true);
    fetchItemsWithNames(order.id)
      .then(setItems)
      .finally(() => setLoadingItems(false));
  }, [open, order?.id]);

  async function handleStatusChange(newStatus: string) {
    if (!order || newStatus === order.status) return;
    setUpdatingStatus(true);
    onStatusChange(order.id, newStatus); // optimistic

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    setUpdatingStatus(false);
    if (error) {
      toast.error("Erreur lors de la mise à jour.");
      onStatusChange(order.id, order.status);
    }
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
        {/* Title */}
        <DialogTitle
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Commande #{String(order.order_number).padStart(4, "0")}
        </DialogTitle>

        <div className="space-y-4">
          {/* Status selector */}
          <div className="flex items-center justify-between gap-3">
            <OrderStatusBadge status={order.status} />
            <div className="flex items-center gap-2">
              {updatingStatus && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              <Select
                value={order.status}
                onValueChange={(v) => { if (v) handleStatusChange(v); }}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Customer info */}
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Client
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{order.customer_name}</span>

              {order.customer_phone && (
                <>
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </>
              )}

              <span className="text-muted-foreground">Mode</span>
              <span>
                <Badge variant="secondary" className="text-xs">
                  {FULFILLMENT_LABELS[order.fulfillment_mode] ??
                    order.fulfillment_mode}
                </Badge>
              </span>

              {order.table_number && (
                <>
                  <span className="text-muted-foreground">Table</span>
                  <span className="font-medium">#{order.table_number}</span>
                </>
              )}

              {order.delivery_address && (
                <>
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="font-medium">{order.delivery_address}</span>
                </>
              )}

              {order.stripe_payment_status && (
                <>
                  <span className="text-muted-foreground">Paiement</span>
                  <span
                    className={
                      order.stripe_payment_status === "paid"
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {order.stripe_payment_status === "paid" ? "✓ Payé" : order.stripe_payment_status}
                  </span>
                </>
              )}
            </div>

            {order.notes && (
              <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm italic text-muted-foreground">
                "{order.notes}"
              </p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Articles
            </p>
            {loadingItems ? (
              <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Chargement…</span>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun article.</p>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="tabular-nums font-medium shrink-0">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                    </div>
                    {item.option_value && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Option : {item.option_value}
                      </p>
                    )}
                    {item.special_note && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        Note : {item.special_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-base">
            <span>Total</span>
            <span style={{ color: "var(--primary)" }}>
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
