"use client";

import Image from "next/image";
import { Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BentoCard, type BentoSize } from "./BentoCard";
import { formatPrice } from "@/lib/utils";

interface SlotSummary {
  label: string;
  quantity: number;
  categoryName: string;
  categoryEmoji: string;
}

interface BentoCardBundleProps {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  slots: SlotSummary[];
  size?: BentoSize;
  omitSizeClasses?: boolean;
  /** Classes grille sur la racine `BentoCard` (ex. pleine largeur vitrine L1 mobile). */
  className?: string;
  onClick?: () => void;
}

export function BentoCardBundle({
  name,
  description,
  price,
  imageUrl,
  slots,
  size = "2x1",
  omitSizeClasses = false,
  className,
  onClick,
}: BentoCardBundleProps) {
  const hasSingleRowHeight = size === "1x1" || size === "2x1";
  const showBundleImage = Boolean(imageUrl) && !hasSingleRowHeight;

  return (
    <BentoCard
      size={size}
      omitSizeClasses={omitSizeClasses}
      onClick={onClick}
      className={cn("flex flex-row overflow-hidden", className)}
    >
      {/* Left: image or icon (hidden on 1-row tiles) */}
      {!hasSingleRowHeight && (
        <div className="relative w-1/3 shrink-0 overflow-hidden rounded-l-[var(--outer-r)] bg-muted">
          {showBundleImage ? (
            <Image src={imageUrl!} alt={name} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Gift
                className="h-10 w-10"
                style={{ color: "var(--primary)" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Right: content */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          hasSingleRowHeight ? "justify-center gap-1 p-3" : "gap-2 p-4"
        )}
      >
        {/* Badge + price */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            style={{
              backgroundColor: "var(--primary)/10",
              color: "var(--primary)",
            }}
          >
            Formule
          </Badge>
          <p
            className={cn(
              "tabular-nums shrink-0 text-foreground font-bold",
              hasSingleRowHeight ? "text-base" : "text-lg"
            )}
          >
            {formatPrice(price)}
          </p>
        </div>

        {/* Name */}
        <p
          className="font-semibold line-clamp-1 leading-tight"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {name}
        </p>

        {/* Description or slots */}
        {description ? (
          <p className={cn("text-xs text-muted-foreground", hasSingleRowHeight ? "line-clamp-1" : "line-clamp-2")}>
            {description}
          </p>
        ) : (
          <div className={cn("flex flex-wrap gap-1", hasSingleRowHeight && "overflow-hidden")}>
            {slots.slice(0, 3).map((slot, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
              >
                <span>{slot.categoryEmoji}</span>
                <span>
                  {slot.quantity}× {slot.label || slot.categoryName}
                </span>
                {i < Math.min(slots.length, 3) - 1 && (
                  <span className="text-border">·</span>
                )}
              </span>
            ))}
            {slots.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{slots.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
