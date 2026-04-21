"use client";

import { cn } from "@/lib/utils";
import { BentoCard, type BentoSize } from "./BentoCard";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface BentoCardCategoryProps {
  name: string;
  iconEmoji: string;
  productCount: number;
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
  size = "1x1",
  omitSizeClasses = false,
  className,
  onClick,
}: BentoCardCategoryProps) {
  const { locale } = useLocale();

  return (
    <BentoCard
      size={size}
      omitSizeClasses={omitSizeClasses}
      onClick={onClick}
      className={cn(omitSizeClasses && "h-full min-h-0", className)}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--color-bento-card-bg,var(--card))" }}
      />

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
          {productCount}{" "}
          {locale === "en"
            ? `product${productCount !== 1 ? "s" : ""}`
            : `produit${productCount !== 1 ? "s" : ""}`}
        </p>
      </div>
    </BentoCard>
  );
}
