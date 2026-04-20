import { Star, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShopReviews } from "@/lib/types";

const REVIEW_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function hasVisibleShopReviews(reviews: ShopReviews | null): boolean {
  const { showGoogle } = getVisibleReviewFlags(reviews);
  return showGoogle;
}

function getVisibleReviewFlags(reviews: ShopReviews | null): { showGoogle: boolean } {
  if (!reviews) return { showGoogle: false };

  const showGoogle = Boolean(
    reviews.google_enabled &&
      reviews.google_rating !== null &&
      reviews.google_last_fetched &&
      Date.now() - new Date(reviews.google_last_fetched).getTime() < REVIEW_MAX_AGE_MS
  );

  return { showGoogle };
}

interface ReviewsDisplayProps {
  reviews: ShopReviews | null;
  /** Affichage plus compact (carte boutique : à côté du titre). */
  compact?: boolean;
  /** Colonne pleine largeur, style proche des boutons (vitrine desktop). */
  stackedFullWidth?: boolean;
  className?: string;
}

function staleLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "aujourd'hui";
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem.`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

function RatingBadge({
  rating,
  reviewCount,
  lastFetched,
  href,
  logo,
  label,
  compact,
  actionRow,
}: {
  rating: number;
  reviewCount: number | null;
  lastFetched: string | null;
  href: string | null;
  logo: React.ReactNode;
  label: string;
  compact?: boolean;
  actionRow?: boolean;
}) {
  const isStale =
    lastFetched &&
    Date.now() - new Date(lastFetched).getTime() > 30 * 24 * 60 * 60 * 1000;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--inner-r,var(--radius-lg))] bg-card",
        actionRow &&
          "min-h-11 w-full justify-between rounded-lg bg-background px-3 py-2.5 hover:bg-muted",
        !actionRow && (compact ? "gap-1.5 px-2 py-1.5 text-xs" : "px-3 py-2 text-sm")
      )}
    >
      <span className="shrink-0 [&_svg]:shrink-0">{logo}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <Star
            className={cn(
              "fill-amber-400 text-amber-400 shrink-0",
              compact ? "h-2.5 w-2.5" : "h-3 w-3"
            )}
          />
          <span className={cn("font-semibold", compact ? "text-[11px]" : "text-xs")}>
            {rating.toFixed(1)}
          </span>
          {reviewCount !== null && (
            <span
              className={cn(
                "text-muted-foreground",
                compact ? "text-[11px]" : "text-xs"
              )}
            >
              · {reviewCount >= 1000
                ? `${(reviewCount / 1000).toFixed(1)}k`
                : reviewCount}{" "}
              avis
            </span>
          )}
        </div>
        {isStale && lastFetched && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            Mis à jour {staleLabel(lastFetched)}
          </span>
        )}
      </div>
      {href && (
        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={`Voir les avis ${label}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "transition-opacity hover:opacity-80",
          actionRow && "block w-full"
        )}
      >
        {content}
      </a>
    );
  }

  return content;
}

function GoogleLogo({ compact }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
      aria-label="Google"
    >
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function ReviewsDisplay({
  reviews,
  compact = false,
  stackedFullWidth = false,
  className,
}: ReviewsDisplayProps) {
  if (!reviews) return null;

  const { showGoogle } = getVisibleReviewFlags(reviews);
  if (!showGoogle) return null;

  const actionRow = stackedFullWidth;

  return (
    <div
      className={cn(
        stackedFullWidth
          ? "flex w-full flex-col gap-2 pt-0"
          : "flex flex-wrap",
        !stackedFullWidth && (compact ? "justify-start gap-1.5 sm:justify-end" : "gap-2 pt-2"),
        className
      )}
    >
      {showGoogle && (
        <RatingBadge
          rating={reviews.google_rating!}
          reviewCount={reviews.google_review_count}
          lastFetched={reviews.google_last_fetched}
          href={reviews.google_url}
          logo={<GoogleLogo compact={compact} />}
          label="Google"
          compact={compact}
          actionRow={actionRow}
        />
      )}
    </div>
  );
}
