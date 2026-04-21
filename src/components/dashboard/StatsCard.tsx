"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  type?: "count" | "currency";
  trend?: { value: number; label: string };
  iconColor?: string;
  /** Pour formatage nombre / monnaie (défaut : français). */
  locale?: AppLocale;
}

function useCountAnimation(target: number, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return count;
}

export function StatsCard({
  icon,
  label,
  value,
  type = "count",
  trend,
  iconColor = "bg-primary text-primary-foreground dark:bg-[oklch(0.205_0_0)] dark:text-[oklch(0.985_0_0)]",
  locale = "fr",
}: StatsCardProps) {
  const animated = useCountAnimation(value);
  const numberLocale = locale === "en" ? "en-US" : "fr-FR";

  const display =
    type === "currency"
      ? formatPrice(animated, "EUR", numberLocale)
      : animated.toLocaleString(numberLocale);

  const trendPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
              {display}
            </p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs",
                  trendPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                )}
              >
                {trendPositive ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&_svg]:text-current",
              iconColor
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
