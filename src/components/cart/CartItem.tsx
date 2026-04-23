"use client";

import Image from "next/image";
import { Eye, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/product/TagBadge";
import { useCartStore, type CartItem } from "@/lib/stores/cartStore";
import { ALLERGENS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CartItemRowProps {
  item: CartItem;
  onReview?: () => void;
}

export function CartItemRow({ item, onReview }: CartItemRowProps) {
  const { t, locale } = useLocale();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const allergenTags = (item.tags ?? []).filter((t) =>
    ALLERGENS.some((a) => a.value === t)
  );

  const optionText =
    item.optionValue && item.optionValue.trim().length > 0
      ? item.optionPriceDelta && item.optionPriceDelta > 0
        ? `${item.optionValue} (+${formatPrice(item.optionPriceDelta)})`
        : item.optionValue
      : null;
  const optionLabel = locale === "en" ? "Option" : "Option";
  const noteLabel = locale === "en" ? "Note" : "Note";

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg">
            {item.isBundle ? "🎁" : (item.fallbackEmoji ?? "🍽️")}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <button
          className="text-left w-full group"
          onClick={onReview}
          aria-label={`${t("cart.details")} ${item.name}`}
        >
          <p className="text-sm font-semibold leading-tight line-clamp-1 group-hover:underline decoration-dotted underline-offset-2">
            {item.name}
          </p>
        </button>

        {/* Product: description + allergens */}
        {!item.isBundle && (
          <>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {item.description}
              </p>
            )}
            {optionText && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                {`${optionLabel} : ${optionText}`}
              </p>
            )}
            {item.specialNote && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                {`${noteLabel} : ${item.specialNote}`}
              </p>
            )}
            {allergenTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {allergenTags.slice(0, 4).map((t) => (
                  <TagBadge key={t} value={t} size="sm" />
                ))}
                {allergenTags.length > 4 && (
                  <span className="text-xs text-muted-foreground">+{allergenTags.length - 4}</span>
                )}
              </div>
            )}
          </>
        )}

        {/* Bundle: step list */}
        {item.isBundle && item.bundleSelections && item.bundleSelections.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {item.bundleSelections.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground line-clamp-1">
                <span className="font-medium text-foreground/70">{s.label} :</span>{" "}
                {s.products.map((p) => p.name).join(", ")}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-0.5">
          {formatPrice(item.price)} {t("cart.perUnit")}
        </p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-1 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-md"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-semibold tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-md"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= 20}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Right: line price + actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: "var(--primary)" }}
        >
          {formatPrice(item.price * item.quantity)}
        </p>
        <div className="flex items-center gap-1">
          {onReview && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={onReview}
              aria-label={t("cart.details")}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeItem(item.id)}
            aria-label={t("cart.remove")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
