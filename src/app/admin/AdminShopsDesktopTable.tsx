import { formatShopCreatedAt } from "@/lib/admin/formatShopCreatedAt";
import { AdminShopReviewBadges } from "./AdminShopReviewBadges";
import { AdminShopRowActions } from "./AdminShopRowActions";
import type { AdminShopMobileRow } from "./AdminShopsMobileList";

interface AdminShopsDesktopTableProps {
  rows: AdminShopMobileRow[];
}

export function AdminShopsDesktopTable({ rows }: AdminShopsDesktopTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-14 text-center text-sm text-muted-foreground">
        Aucune boutique dans le tableau (hors modèle démo réservé).
      </div>
    );
  }

  return (
    <div className="relative min-w-0 rounded-2xl border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Boutique</th>
              <th className="px-4 py-3 font-medium">Propriétaire</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Créé</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Avis</th>
              <th className="px-4 py-3 w-[1%] text-right font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 align-top">
                    <div className="flex min-w-0 max-w-[14rem] flex-col gap-0.5">
                      <span className="font-medium text-foreground">{row.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">/{row.slug}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex min-w-0 max-w-[12rem] flex-col gap-0.5">
                      {row.ownerFullName ? (
                        <span className="font-medium text-foreground">{row.ownerFullName}</span>
                      ) : null}
                      <span className="break-all text-xs text-muted-foreground">
                        {row.ownerEmail ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground whitespace-nowrap">
                    {formatShopCreatedAt(row.created_at)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={
                        row.is_active
                          ? "inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300"
                          : "inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AdminShopReviewBadges rev={row.rev} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AdminShopRowActions
                      shopId={row.id}
                      shopUrl={row.shopUrl}
                      isActive={row.is_active}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
