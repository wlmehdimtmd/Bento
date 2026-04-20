import { cn } from "@/lib/utils";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const STATUS_META: Record<
  string,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending: {
    label: "En attente",
    dot: "bg-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
  },
  confirmed: {
    label: "Confirmée",
    dot: "bg-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
  },
  preparing: {
    label: "En préparation",
    dot: "bg-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
  },
  ready: {
    label: "Prête",
    dot: "bg-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
  },
  delivered: {
    label: "Livrée",
    dot: "bg-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
  },
  cancelled: {
    label: "Annulée",
    dot: "bg-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
  },
};

export function OrderStatusBadge({
  status,
  size = "md",
}: OrderStatusBadgeProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        meta.bg,
        meta.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("rounded-full shrink-0", meta.dot, size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")} />
      {meta.label}
    </span>
  );
}
