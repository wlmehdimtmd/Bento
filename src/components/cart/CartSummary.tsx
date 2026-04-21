"use client";

import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CartSummaryProps {
  count: number;
  total: number;
}

export function CartSummary({ count, total }: CartSummaryProps) {
  const { t } = useLocale();
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>
          {count} {t("cart.itemsLabel")}
        </span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between font-bold text-base border-t border-border pt-2">
        <span>{t("cart.total")}</span>
        <span
          className="tabular-nums"
          style={{ color: "var(--primary)" }}
        >
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
