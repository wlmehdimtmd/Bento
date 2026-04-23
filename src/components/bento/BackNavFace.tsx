"use client";

import type { CSSProperties } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Fond monochrome discret aligné sur la DA marque. */
export const backNavAccentGradientStyle: CSSProperties = {
  background: "var(--primary)",
};

export interface BackNavFaceProps {
  categoryName: string;
  categoryEmoji: string;
  description?: string | null;
  density: "full" | "compact";
  className?: string;
}

export function BackNavFace({
  categoryName,
  categoryEmoji,
  description,
  density,
  className,
}: BackNavFaceProps) {
  const compact = density === "compact";

  return (
    <div
      className={cn(
        "relative flex min-h-0 items-center rounded-xl",
        compact
          ? "gap-2.5 px-3 py-2"
          : "h-auto justify-center px-5 py-3 min-[351px]:h-full min-[351px]:py-0",
        className
      )}
      style={{ backgroundColor: "var(--bento-floating-surface-bg)" }}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          compact ? "h-8 w-8" : "absolute left-4 top-4 h-10 w-10"
        )}
        style={{ backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)" }}
      >
        <ChevronLeft
          className={compact ? "h-5 w-5" : "h-6 w-6"}
          style={{ color: "var(--primary)" }}
          aria-hidden
        />
      </div>

      <div
        className={cn(
          "min-w-0",
          compact ? "flex-1" : "mx-auto flex w-full max-w-[80%] flex-col items-center text-center"
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            compact ? "" : "justify-center"
          )}
        >
          <span className={compact ? "text-xl leading-none" : "text-2xl"}>
            {categoryEmoji}
          </span>
          <p
            className={cn(
              "min-w-0 truncate font-bold",
              compact ? "text-base" : "text-lg"
            )}
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {categoryName}
          </p>
        </div>
        {description && (
          <p
            className={cn(
              "line-clamp-1 text-muted-foreground",
              compact ? "mt-0.5 text-xs" : "mt-0.5 text-sm"
            )}
          >
            {description}
          </p>
        )}
        {!description && (
          <p
            className={cn(
              "line-clamp-1 text-muted-foreground",
              compact ? "mt-0.5 text-[10px] leading-tight" : "mt-0.5 text-xs"
            )}
          >
            Retour aux catégories
          </p>
        )}
      </div>
    </div>
  );
}
