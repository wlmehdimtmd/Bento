"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/stores/cartStore";
import { FULFILLMENT_MODES } from "@/lib/constants";
import type { FulfillmentMode } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type {
  CheckoutSuccessSyncState,
  OrderConfirmationLine,
} from "@/lib/checkout/loadCheckoutSuccessPayload";

import { OrderSuccessPendingRefresh, ORDER_SUCCESS_PENDING_REFRESH_MS } from "./OrderSuccessPendingRefresh";

const LEGACY_FULFILLMENT: Record<string, FulfillmentMode> = {
  sur_place: "dine_in",
  a_emporter: "takeaway",
  livraison: "delivery",
};

function fulfillmentLabel(mode: string, locale: "fr" | "en"): string {
  const asCanon = FULFILLMENT_MODES.some((m) => m.value === mode) ? (mode as FulfillmentMode) : null;
  const normalized = (LEGACY_FULFILLMENT[mode] ?? asCanon) as FulfillmentMode | null;
  if (normalized) {
    const row = FULFILLMENT_MODES.find((m) => m.value === normalized);
    if (row) return locale === "en" ? row.labelEn : row.label;
  }
  return mode;
}

export type OrderConfirmationOrder = {
  id: string;
  order_number: number;
  total_amount: number;
  fulfillment_mode: string;
  customer_name: string;
  table_number: string | null;
  delivery_address: string | null;
  status: string;
};

export interface OrderConfirmationProps {
  order: OrderConfirmationOrder;
  shopSlug: string;
  lineItems: OrderConfirmationLine[];
  syncState: CheckoutSuccessSyncState;
}

export function OrderConfirmation({ order, shopSlug, lineItems, syncState }: OrderConfirmationProps) {
  const { t, locale } = useLocale();
  const clearCart = useCartStore((s) => s.clearCart);
  const loc = locale === "en" ? "en" : "fr";
  const numberLocale = locale === "en" ? "en-US" : "fr-FR";

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPendingWebhook = syncState === "pending_webhook";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8 bg-muted/40 shrink-0">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
          >
            {isPendingWebhook ? (
              <Clock className="h-16 w-16 text-amber-500" aria-hidden />
            ) : (
              <CheckCircle2 className="h-16 w-16" style={{ color: "#22c55e" }} aria-hidden />
            )}
          </motion.div>
          <div className="text-center space-y-1 w-full">
            <h2
              className="text-xl font-bold sm:text-2xl"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              {isPendingWebhook ? t("order.pendingPaymentTitle") : t("order.confirmed")}
            </h2>
            {isPendingWebhook && (
              <p className="text-sm text-muted-foreground px-1">{t("order.pendingPaymentBody")}</p>
            )}
            <p
              className="text-3xl font-bold tracking-tight pt-2"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              {locale === "en" ? "Order" : "Commande"}{" "}
              <span className="text-foreground">#{String(order.order_number).padStart(4, "0")}</span>
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto min-h-0">
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">{t("order.customerLabel")}</span>
              <span className="font-medium text-right">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{locale === "en" ? "Mode" : "Mode"}</span>
              <span className="font-medium">{fulfillmentLabel(order.fulfillment_mode, loc)}</span>
            </div>
            {order.table_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{locale === "en" ? "Table" : "Table"}</span>
                <span className="font-medium">#{order.table_number}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{locale === "en" ? "Delivery" : "Livraison"}</span>
                <span className="font-medium text-right">{order.delivery_address}</span>
              </div>
            )}
          </div>

          {lineItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("order.items")}
                </p>
                {lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground min-w-0">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="tabular-nums font-medium shrink-0">
                      {formatPrice(item.unitPrice * item.quantity, "EUR", numberLocale)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between font-bold text-base">
            <span>{t("order.totalPaid")}</span>
            <span className="text-foreground">
              {formatPrice(order.total_amount, "EUR", numberLocale)}
            </span>
          </div>

          {isPendingWebhook && (
            <div className="space-y-2">
              <OrderSuccessPendingRefresh />
              <p className="text-center text-xs text-muted-foreground">
                {locale === "en"
                  ? `Auto-refresh every ${ORDER_SUCCESS_PENDING_REFRESH_MS / 1000} s`
                  : `Actualisation auto toutes les ${ORDER_SUCCESS_PENDING_REFRESH_MS / 1000} s`}
              </p>
            </div>
          )}

          <Link href={`/${shopSlug}`} className="block">
            <Button variant="outline" className="w-full">
              ← {t("common.backToShop")}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
