import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  count: number;
  total: number;
}

export function CartSummary({ count, total }: CartSummaryProps) {
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>
          {count} article{count > 1 ? "s" : ""}
        </span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
      <div className="flex justify-between font-bold text-base border-t border-border pt-2">
        <span>Total</span>
        <span
          className="tabular-nums"
          style={{ color: "var(--color-bento-accent)" }}
        >
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
}
