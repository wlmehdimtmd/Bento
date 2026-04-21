"use client";

import { cn } from "@/lib/utils";
import { formatShopCreatedAt } from "@/lib/admin/formatShopCreatedAt";
import { AdminShopReviewBadges } from "./AdminShopReviewBadges";
import { AdminShopRowActions } from "./AdminShopRowActions";

export type AdminShopMobileRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  ownerEmail: string | null;
  ownerFullName: string | null;
  shopUrl: string;
  rev:
    | {
        google_enabled?: boolean;
        google_last_fetched?: string | null;
        tripadvisor_enabled?: boolean;
        tripadvisor_last_fetched?: string | null;
      }
    | undefined;
};

interface AdminShopsMobileListProps {
  rows: AdminShopMobileRow[];
  className?: string;
}

export function AdminShopsMobileList({ rows, className }: AdminShopsMobileListProps) {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground",
          className
        )}
      >
        Aucune boutique enregistrée.
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)} role="list">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-tight text-foreground">{row.name}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{row.slug}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Créé le {formatShopCreatedAt(row.created_at)}
              </p>
            </div>

            <div className="text-xs">
              <p className="text-muted-foreground">Propriétaire</p>
              {row.ownerFullName ? (
                <p className="font-medium text-foreground">{row.ownerFullName}</p>
              ) : null}
              <p className="text-muted-foreground">{row.ownerEmail ?? "—"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  row.is_active
                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {row.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Avis</p>
              <AdminShopReviewBadges rev={row.rev} />
            </div>

            <div className="border-t border-border pt-3">
              <AdminShopRowActions shopId={row.id} shopUrl={row.shopUrl} isActive={row.is_active} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
