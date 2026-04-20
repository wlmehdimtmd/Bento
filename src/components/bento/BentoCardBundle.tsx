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
  return (
    <BentoCard
      size={size}
      omitSizeClasses={omitSizeClasses}
      onClick={onClick}
      className={cn("flex flex-row", omitSizeClasses && "h-full min-h-0", className)}
    >
      {/* Left: image or icon */}
      <div className="relative w-1/3 shrink-0 overflow-hidden rounded-l-[var(--outer-r)] bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <Gift
              className="h-10 w-10"
              style={{ color: "var(--color-bento-accent)" }}
            />
          </div>
        )}
      </div>

      {/* Right: content */}
      <div className="flex flex-col gap-2 p-4 flex-1 min-w-0">
        {/* Badge + price */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="text-xs shrink-0"
            style={{
              backgroundColor: "var(--color-bento-accent)/10",
              color: "var(--color-bento-accent)",
            }}
          >
            Formule
          </Badge>
          <p className="text-lg font-bold tabular-nums shrink-0 text-foreground">
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
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
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
