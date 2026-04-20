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
          "border border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-400/18 dark:text-emerald-200",
      };
    case "closed":
      return {
        label: "Fermé",
        className:
          "border border-destructive/45 bg-destructive/12 text-destructive dark:border-destructive/50 dark:bg-destructive/18 dark:text-destructive",
      };
    case "unknown":
      return {
        label: "Horaire",
        className:
          "border border-border/80 bg-background/95 text-foreground dark:border-border dark:bg-background/70",
      };
    default:
      return { label: "", className: "" };
  }
}
