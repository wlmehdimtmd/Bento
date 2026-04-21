"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface OrderRow {
  id: string;
  order_number: number;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface RecentOrdersProps {
  orders: OrderRow[];
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const found = ORDER_STATUSES.find((s) => s.value === status);
  return (
    <Badge
      variant="outline"
      style={found ? { borderColor: found.color, color: found.color } : undefined}
    >
      {label}
    </Badge>
  );
}

function relativeTime(iso: string, locale: "fr" | "en") {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return locale === "en" ? "just now" : "à l'instant";
  if (mins < 60) return locale === "en" ? `${mins} min ago` : `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "en" ? `${hours} h ago` : `il y a ${hours} h`;
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR");
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const { locale, t } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {tr("Aucune commande pour l'instant.", "No orders yet.")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{tr("N°", "No.")}</TableHead>
            <TableHead>{tr("Client", "Customer")}</TableHead>
            <TableHead className="text-right">{tr("Montant", "Amount")}</TableHead>
            <TableHead>{tr("Statut", "Status")}</TableHead>
            <TableHead className="text-right">{tr("Heure", "Time")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{order.order_number}
              </TableCell>
              <TableCell className="font-medium">{order.customer_name}</TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(
                  order.total_amount,
                  "EUR",
                  locale === "en" ? "en-US" : "fr-FR"
                )}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={order.status}
                  label={t(`order.status.${order.status}`, order.status)}
                />
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {relativeTime(order.created_at, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
