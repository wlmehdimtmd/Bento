export type ReviewSyncState = "never_synced" | "error" | "stale" | "ok";

export function staleDaysSinceFetch(
  lastFetched: string | null | undefined,
  nowMs: number = Date.now()
): number | null {
  if (!lastFetched) return null;
  const t = new Date(lastFetched).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((nowMs - t) / 86_400_000);
}

/**
 * Statut d’une intégration d’avis TripAdvisor pour l’admin.
 * `null` si la source est désactivée.
 */
export function getReviewIntegrationStatus(
  enabled: boolean | undefined,
  lastFetched: string | null | undefined,
  nowMs: number = Date.now()
): ReviewSyncState | null {
  if (!enabled) return null;
  const days = staleDaysSinceFetch(lastFetched, nowMs);
  if (days === null) return "never_synced";
  if (days > 90) return "error";
  if (days > 30) return "stale";
  return "ok";
}

export function reviewStatusMeta(
  state: ReviewSyncState,
  days: number | null
): { label: string; title: string; badgeClass: string } {
  switch (state) {
    case "never_synced":
      return {
        label: "Sync",
        title: "Jamais synchronisé",
        badgeClass:
          "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      };
    case "error":
      return {
        label: "Alerte",
        title: days != null ? `Dernière synch. il y a ${days} j (>90 j)` : "Synch. en échec",
        badgeClass: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300",
      };
    case "stale":
      return {
        label: "Stale",
        title: days != null ? `Dernière synch. il y a ${days} j (>30 j)` : "Données anciennes",
        badgeClass:
          "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      };
    case "ok":
      return {
        label: "OK",
        title: days != null ? `Dernière synch. il y a ${days} j` : "Synchronisé",
        badgeClass:
          "border-emerald-600/35 bg-emerald-600/10 text-emerald-900 dark:text-emerald-300",
      };
  }
}
