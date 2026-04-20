"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────

export interface OrderRow {
  id: string;
  shop_id: string;
  order_number: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  fulfillment_mode: string;
  table_number: string | null;
  delivery_address: string | null;
  status: string;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  stripe_payment_status: string | null;
  notes: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

const NEXT_STATUS: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

const ADVANCE_LABEL: Record<string, string> = {
  pending: "Confirmer",
  confirmed: "En préparation",
  preparing: "Prête",
  ready: "Livrée",
};

const FULFILLMENT_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

// ── Component ──────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderRow;
  onStatusChange: (id: string, newStatus: string) => void;
  onOpenDetail: (order: OrderRow) => void;
}

export function OrderCard({
  order,
  onStatusChange,
  onOpenDetail,
}: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const nextStatus = NEXT_STATUS[order.status];

  async function advanceStatus() {
    if (!nextStatus) return;
    setIsUpdating(true);
    onStatusChange(order.id, nextStatus); // optimistic

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", order.id);

    setIsUpdating(false);
    if (error) {
      toast.error("Erreur lors de la mise à jour.");
      onStatusChange(order.id, order.status); // rollback
    }
  }

  async function cancelOrder() {
    if (order.status === "cancelled" || order.status === "delivered") return;
    setIsUpdating(true);
    onStatusChange(order.id, "cancelled"); // optimistic

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);

    setIsUpdating(false);
    if (error) {
      toast.error("Erreur lors de l'annulation.");
      onStatusChange(order.id, order.status); // rollback
    }
  }

  const isFinal = order.status === "delivered" || order.status === "cancelled";

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-muted-foreground/30 transition-colors cursor-pointer"
      onClick={() => onOpenDetail(order)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              #{String(order.order_number).padStart(4, "0")}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(order.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {order.customer_name}
            {order.table_number && (
              <span className="text-xs"> · Table {order.table_number}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p
            className="font-bold tabular-nums text-sm"
            style={{ color: "var(--primary)" }}
          >
            {formatPrice(order.total_amount)}
          </p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <OrderStatusBadge status={order.status} size="sm" />
        <Badge variant="secondary" className="text-xs">
          {FULFILLMENT_LABELS[order.fulfillment_mode] ?? order.fulfillment_mode}
        </Badge>
        {order.stripe_payment_status === "paid" && (
          <Badge variant="secondary" className="text-xs text-green-600">
            💳 Payé
          </Badge>
        )}
      </div>

      {/* Actions */}
      {!isFinal && (
        <div
          className="flex items-center gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {nextStatus && ADVANCE_LABEL[order.status] && (
            <Button
              size="sm"
              disabled={isUpdating}
              className="flex-1 text-white text-xs hover:opacity-90"
              style={{ backgroundColor: "var(--primary)" }}
              onClick={advanceStatus}
            >
              {ADVANCE_LABEL[order.status]} →
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isUpdating}
            onClick={cancelOrder}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            aria-label="Annuler"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
