"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { OrderCard, type OrderRow } from "./OrderCard";
import { OrderDetail } from "./OrderDetail";
import { useLocale } from "@/components/i18n/LocaleProvider";

// ── Notification sound ─────────────────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext may be blocked — silently ignore
  }
}

// ── Tabs config ────────────────────────────────────────────────

const TABS = [
  { id: "all", key: "dashboard.orders.tabs.all", fallback: "All", statuses: null },
  { id: "pending", key: "dashboard.orders.tabs.pending", fallback: "Pending", statuses: ["pending"] },
  { id: "confirmed", key: "dashboard.orders.tabs.confirmed", fallback: "Confirmed", statuses: ["confirmed"] },
  { id: "preparing", key: "dashboard.orders.tabs.preparing", fallback: "Preparing", statuses: ["preparing"] },
  { id: "ready", key: "dashboard.orders.tabs.ready", fallback: "Ready", statuses: ["ready"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Component ──────────────────────────────────────────────────

interface OrderListProps {
  initialOrders: OrderRow[];
  shopId: string;
}

export function OrderList({ initialOrders, shopId }: OrderListProps) {
  const { t } = useLocale();
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);

  // ── Optimistic status change ───────────────────────────────

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    setDetailOrder((prev) =>
      prev?.id === id ? { ...prev, status: newStatus } : prev
    );
  }, []);

  // ── Realtime subscription ──────────────────────────────────

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`orders:shop:${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const newOrder = payload.new as OrderRow;
          setOrders((prev) => {
            // Avoid duplicates
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          playNotificationSound();
          toast.success(
            `🍱 Nouvelle commande #${String(newOrder.order_number).padStart(4, "0")} — ${newOrder.customer_name}`,
            { duration: 6000 }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        (payload) => {
          const updated = payload.new as OrderRow;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
          setDetailOrder((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  // ── Filtering & sorting ────────────────────────────────────

  const tab = TABS.find((t) => t.id === activeTab)!;
  const filtered = orders
    .filter((o) =>
      tab.statuses === null
        ? true
        : (tab.statuses as readonly string[]).includes(o.status)
    )
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );

  function countForTab(tabId: TabId) {
    const t = TABS.find((x) => x.id === tabId)!;
    if (t.statuses === null) return orders.length;
    return orders.filter((o) =>
      (t.statuses as readonly string[]).includes(o.status)
    ).length;
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tabItem) => {
          const count = countForTab(tabItem.id);
          const isActive = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(tabItem.key, tabItem.fallback)}
              {count > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-border text-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {activeTab === "all"
              ? t("dashboard.orders.emptyAll", "No orders for this shop.")
              : t("dashboard.orders.emptyFiltered", "No orders in this category.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <OrderCard
                  order={order}
                  onStatusChange={handleStatusChange}
                  onOpenDetail={setDetailOrder}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail dialog */}
      <OrderDetail
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
