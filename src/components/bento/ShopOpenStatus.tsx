"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { getShopOpenState, type ShopOpenStateMode } from "@/lib/openingHours";

const TICK_MS = 60_000;

export interface ShopOpenStatusProps {
  fulfillmentModes: string[];
  openingHoursJson: unknown | null;
  openingTimezone: string;
  openOnPublicHolidays: boolean;
  className?: string;
}

export function ShopOpenStatus({
  fulfillmentModes,
  openingHoursJson,
  openingTimezone,
  openOnPublicHolidays,
  className,
}: ShopOpenStatusProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const state = getShopOpenState({
    fulfillmentModes,
    openingHoursJson,
    openingTimezone,
    openOnPublicHolidays,
    now,
  });

  if (state.mode === "hidden") return null;

  const badge = badgeForMode(state.mode);

  return (
    <div className={cn("flex shrink-0 flex-wrap items-center gap-2", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          badge.className
        )}
      >
        {badge.label}
      </span>
      {state.subtitle ? (
        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
          {state.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function badgeForMode(mode: ShopOpenStateMode): { label: string; className: string } {
  switch (mode) {
    case "open":
      return {
        label: "Ouvert",
        className:
          "bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 dark:text-emerald-300",
      };
    case "closed":
      return {
        label: "Fermé",
        className: "bg-red-500/15 text-red-700 border border-red-500/40 dark:text-red-300",
      };
    case "unknown":
      return {
        label: "Horaire",
        className: "bg-amber-500/10 text-amber-900 border border-amber-500/35 dark:text-amber-100",
      };
    default:
      return { label: "", className: "" };
  }
}
