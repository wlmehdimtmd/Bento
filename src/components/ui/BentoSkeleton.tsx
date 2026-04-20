import { Skeleton } from "@/components/ui/skeleton";

import { BENTO_GRID_BASE_CLASS } from "@/components/bento/bentoGridConstants";

// ── Single card skeleton ───────────────────────────────────────

function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`rounded-[var(--bento-outer-r)] ${className}`} />;
}

// ── Bento grid skeleton (level 1 — categories + info card) ─────

export function BentoGridSkeleton() {
  return (
    <div className={`${BENTO_GRID_BASE_CLASS} grid-cols-2 sm:grid-cols-2 lg:grid-cols-4`}>
      {/* Info card 2×2 */}
      <CardSkeleton className="col-span-2 row-span-2" />
      {/* Categories 1×1 */}
      <CardSkeleton className="col-span-1 row-span-1" />
      <CardSkeleton className="col-span-1 row-span-1" />
      <CardSkeleton className="col-span-1 row-span-1" />
      <CardSkeleton className="col-span-1 row-span-1" />
      {/* Bundle 2×1 */}
      <CardSkeleton className="col-span-2 row-span-1" />
    </div>
  );
}

// ── Bento grid skeleton (level 2 — products) ──────────────────

export function BentoProductsSkeleton() {
  return (
    <div className={`${BENTO_GRID_BASE_CLASS} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`}>
      {/* Back card */}
      <CardSkeleton className="col-span-1 sm:col-span-2 row-span-1" />
      {/* Products */}
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} className="col-span-1 row-span-1" />
      ))}
    </div>
  );
}

// ── Order list skeleton ────────────────────────────────────────

export function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tab row */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      {/* Cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dashboard skeleton ─────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
