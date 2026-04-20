"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { PriceTag } from "@/components/product/PriceTag";
import { TagBadge } from "@/components/product/TagBadge";

interface BentoCardProductProps {
  name: string;
  price: number;
  imageUrl?: string | null;
  fallbackEmoji?: string;
  tags?: string[];
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
  isAvailable,
  onAddToCart,
  onClick,
}: BentoCardProductProps) {
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
            Indisponible
          </span>
        </div>
      )}

      {/* Tags (top-left) */}
      {tags.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {tags.slice(0, 2).map((t) => (
            <TagBadge key={t} value={t} size="sm" />
          ))}
        </div>
      )}

      {/* [+] button (top-right) */}
      {isAvailable && (
        <button
          type="button"
          onClick={onAddToCart}
          aria-label={`Ajouter ${name} au panier`}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "var(--color-bento-accent)" }}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/85 p-3 [--p:0.75rem] [--inner-r:max(0px,calc(var(--outer-r)-var(--p)))] rounded-b-[var(--outer-r)] rounded-t-[var(--inner-r)]">
        <p className="text-sm font-semibold text-white line-clamp-2 leading-tight mb-1">
          {name}
        </p>
        <PriceTag price={price} size="sm" className="text-white" />
      </div>
    </BentoCard>
  );
}
