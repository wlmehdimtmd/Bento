"use client";

import { useState } from "react";

import {
  getReviewIntegrationStatus,
  reviewStatusMeta,
  staleDaysSinceFetch,
  type ReviewSyncState,
} from "@/lib/admin/review-status";

type ReviewRow = {
  google_enabled?: boolean;
  google_last_fetched?: string | null;
  tripadvisor_enabled?: boolean;
  tripadvisor_last_fetched?: string | null;
};

interface AdminShopReviewBadgesProps {
  rev: ReviewRow | undefined;
}

export function AdminShopReviewBadges({ rev }: AdminShopReviewBadgesProps) {
  const [nowMs] = useState(() => Date.now());
  const g = getReviewIntegrationStatus(rev?.google_enabled, rev?.google_last_fetched, nowMs);
  const ta = getReviewIntegrationStatus(
    rev?.tripadvisor_enabled,
    rev?.tripadvisor_last_fetched,
    nowMs
  );

  if (!g && !ta) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <ul className="flex flex-col gap-1.5 text-xs">
      {g ? (
        <li className="flex items-center gap-1.5">
          <span className="w-6 shrink-0 font-medium text-muted-foreground">G</span>
          <ReviewBadge state={g} channel="Google" lastFetched={rev?.google_last_fetched} nowMs={nowMs} />
        </li>
      ) : null}
      {ta ? (
        <li className="flex items-center gap-1.5">
          <span className="w-6 shrink-0 font-medium text-muted-foreground">TA</span>
          <ReviewBadge
            state={ta}
            channel="TripAdvisor"
            lastFetched={rev?.tripadvisor_last_fetched}
            nowMs={nowMs}
          />
        </li>
      ) : null}
    </ul>
  );
}

function ReviewBadge({
  state,
  channel,
  lastFetched,
  nowMs,
}: {
  state: ReviewSyncState;
  channel: "Google" | "TripAdvisor";
  lastFetched: string | null | undefined;
  nowMs: number;
}) {
  const days = staleDaysSinceFetch(lastFetched, nowMs);
  const meta = reviewStatusMeta(state, days);
  return (
    <span
      className={`inline-flex max-w-[9rem] items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${meta.badgeClass}`}
      title={meta.title}
    >
      <span className="sr-only">
        {channel} : {meta.title}
      </span>
      <span aria-hidden="true">{meta.label}</span>
    </span>
  );
}
