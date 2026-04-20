"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { BentoCard, type BentoSize } from "./BentoCard";

interface BentoCardCategoryProps {
  name: string;
  iconEmoji: string;
  productCount: number;
  coverImageUrl?: string | null;
  size?: BentoSize;
  omitSizeClasses?: boolean;
  /** Classes sur la racine `BentoCard` (ex. `sm:col-span-2` pour titre long en grille 2 cols). */
  className?: string;
  onClick?: () => void;
}

export function BentoCardCategory({
  name,
  iconEmoji,
  productCount,
  coverImageUrl,
  size = "1x1",
  omitSizeClasses = false,
  className,
  onClick,
}: BentoCardCategoryProps) {
  return (
    <BentoCard
      size={size}
      omitSizeClasses={omitSizeClasses}
      onClick={onClick}
      className={cn(omitSizeClasses && "h-full min-h-0", className)}
    >
      {/* Background image */}
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Solid overlay on image for legibility */}
      {coverImageUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* Content — dark text on muted bg, white text on image+overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <span className="text-4xl leading-none">{iconEmoji}</span>
        <p
          className={`font-semibold line-clamp-2 leading-tight ${coverImageUrl ? "text-white" : "text-foreground"}`}
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {name}
        </p>
        <p className={`text-xs ${coverImageUrl ? "text-white/80" : "text-muted-foreground"}`}>
          {productCount} produit{productCount !== 1 ? "s" : ""}
        </p>
      </div>
    </BentoCard>
  );
}
