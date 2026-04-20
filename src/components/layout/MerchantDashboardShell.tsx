import { cn } from "@/lib/utils";

/**
 * Enveloppe racine du dashboard marchand : active les tokens
 * `.dark [data-merchant-dashboard]` (sidebar plus foncée, zone main et cartes plus claires).
 */
export function MerchantDashboardShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-merchant-dashboard className={cn("min-h-screen", className)}>
      {children}
    </div>
  );
}
