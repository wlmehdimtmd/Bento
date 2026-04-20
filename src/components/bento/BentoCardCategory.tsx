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
      {/* Background image ou fond carte */}
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "var(--color-bento-card-bg,var(--card))" }}
        />
      )}

      {coverImageUrl ? (
        <div className="absolute bottom-2 left-1/2 z-10 flex w-fit max-w-[calc(100%-1rem)] -translate-x-1/2 flex-col items-center gap-1 rounded-lg bg-white/85 px-3 py-2 text-center shadow-sm dark:bg-black/65 dark:shadow-none">
          <span className="text-3xl leading-none" aria-hidden>
            {iconEmoji}
          </span>
          <p
            className="font-semibold leading-tight text-foreground line-clamp-2 dark:text-white"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {name}
          </p>
          <p className="text-xs text-muted-foreground dark:text-white/80">
            {productCount} produit{productCount !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="text-4xl leading-none" aria-hidden>
            {iconEmoji}
          </span>
          <p
            className="font-semibold text-foreground line-clamp-2 leading-tight"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {name}
          </p>
          <p className="text-xs text-muted-foreground">
            {productCount} produit{productCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </BentoCard>
  );
}
