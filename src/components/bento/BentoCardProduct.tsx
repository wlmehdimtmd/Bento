"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { PriceTag } from "@/components/product/PriceTag";
import { TagBadge } from "@/components/product/TagBadge";
import type { ProductLabelOption } from "@/lib/shop-labels";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface BentoCardProductProps {
  name: string;
  price: number;
  imageUrl?: string | null;
  fallbackEmoji?: string;
  tags?: string[];
  shopLabels?: ProductLabelOption[];
  isAvailable: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export function BentoCardProduct({
  name,
  price,
  imageUrl,
  fallbackEmoji = "🍽️",
  tags = [],
  shopLabels,
  isAvailable,
  onAddToCart,
  onClick,
}: BentoCardProductProps) {
  const { locale } = useLocale();
  return (
    <BentoCard size="1x1" onClick={isAvailable ? onClick : undefined}>
      {/* Background */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-muted/60 flex items-center justify-center">
          <span className="text-5xl select-none">{fallbackEmoji}</span>
        </div>
      )}

      {/* Unavailable overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground border border-border">
            {locale === "en" ? "Unavailable" : "Indisponible"}
          </span>
        </div>
      )}

      {/* Tags (top-left) */}
      {tags.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {tags.slice(0, 2).map((t) => (
            <TagBadge key={t} value={t} size="sm" labels={shopLabels} />
          ))}
        </div>
      )}

      {/* [+] button (top-right) */}
      {isAvailable && (
        <button
          type="button"
          onClick={onAddToCart}
          aria-label={locale === "en" ? `Add ${name} to cart` : `Ajouter ${name} au panier`}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      )}

      {/* Bottom info — fond blanc 85 %, hauteur au contenu (max. largeur carte) */}
      <div
        className="absolute bottom-2 left-2 z-10 flex w-fit max-w-[calc(100%-1rem)] flex-col gap-0.5 rounded-lg px-2.5 py-1.5 shadow-sm dark:shadow-none"
        style={{ backgroundColor: "var(--bento-floating-surface-bg)" }}
      >
        <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2 dark:text-white">{name}</p>
        <PriceTag price={price} size="sm" className="text-foreground dark:text-white" />
      </div>
    </BentoCard>
  );
}
