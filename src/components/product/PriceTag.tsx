import { formatPrice, cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "text-sm font-bold",
  md: "text-base font-bold",
  lg: "text-2xl font-bold",
};

export function PriceTag({ price, size = "md", className }: PriceTagProps) {
  return (
    <span
      className={cn("tabular-nums", sizeClasses[size], className)}
      style={{ color: "var(--primary)" }}
    >
      {formatPrice(price)}
    </span>
  );
}
