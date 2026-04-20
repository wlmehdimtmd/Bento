"use client";

import Image from "next/image";
import { Phone, Mail, Map, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BentoCard, type BentoSize } from "./BentoCard";
import { ReviewsDisplay } from "./ReviewsDisplay";
import { ShopOpenStatus } from "./ShopOpenStatus";
import type { SocialLinks, ShopReviews } from "@/lib/types";

interface BentoCardInfoProps {
  cardSize?: BentoSize;
  omitSizeClasses?: boolean;
  /** Classes grille (ex. `col-span-2 row-span-2` sur vitrine L1 mobile à 2 colonnes). */
  cardClassName?: string;
  shopName: string;
  shopSlug: string;
  description?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  emailContact?: string | null;
  socialLinks?: SocialLinks;
  reviews?: ShopReviews | null;
  fulfillmentModes?: string[];
  openingHoursJson?: unknown | null;
  openingTimezone?: string;
  openOnPublicHolidays?: boolean;
}

function mapsDirectionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function BentoCardInfo({
  cardSize = "2x2",
  omitSizeClasses = false,
  cardClassName,
  shopName,
  shopSlug: _shopSlug,
  description,
  coverUrl,
  logoUrl: _logoUrl,
  address,
  phone,
  emailContact,
  socialLinks: _socialLinks = {},
  reviews,
  fulfillmentModes = [],
  openingHoursJson = null,
  openingTimezone = "Europe/Paris",
  openOnPublicHolidays = false,
}: BentoCardInfoProps) {
  const contactOnStorefront = _socialLinks.show_contact_on_storefront !== false;
  const hasActions =
    contactOnStorefront && Boolean(emailContact || phone || address);
  const canDirections = Boolean(address);
  const canMail = Boolean(emailContact);
  const extraActionCount = (canDirections ? 1 : 0) + (canMail ? 1 : 0);

  const iconActionClass = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "shrink-0"
  );

  return (
    <BentoCard
      size={cardSize}
      omitSizeClasses={omitSizeClasses}
      disableHover
      className={cn("flex flex-col", omitSizeClasses && "h-full min-h-0", cardClassName)}
    >
      <div className="relative h-52 w-full shrink-0 bg-muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={shopName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ backgroundColor: "var(--color-bento-accent)" }}
          />
        )}
        <div className="pointer-events-auto absolute right-2 bottom-2 z-10 max-w-[min(100%-0.75rem,16rem)]">
          <ReviewsDisplay
            reviews={reviews ?? null}
            compact
            className="justify-end drop-shadow-md"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 [--p:1rem] [--inner-r:max(0px,calc(var(--outer-r)-var(--p)))]">
        <ShopOpenStatus
          fulfillmentModes={fulfillmentModes}
          openingHoursJson={openingHoursJson}
          openingTimezone={openingTimezone}
          openOnPublicHolidays={openOnPublicHolidays}
        />

        <h2
          className="line-clamp-2 text-2xl font-bold leading-tight tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {shopName}
        </h2>

        {description && (
          <p className="line-clamp-6 text-sm whitespace-pre-line text-muted-foreground">
            {description}
          </p>
        )}

        {hasActions && (
          <div
            className={cn(
              "mt-auto flex w-full flex-row items-center gap-2",
              !phone && extraActionCount > 0 && "justify-end"
            )}
          >
            {extraActionCount > 0 &&
              (extraActionCount === 2 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={iconActionClass}
                    aria-label="Itinéraire, écrire"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    {canDirections && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            mapsDirectionsUrl(address!),
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        <Map aria-hidden />
                        Itinéraire
                      </DropdownMenuItem>
                    )}
                    {canMail && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${emailContact}`;
                        }}
                      >
                        <Mail aria-hidden />
                        Écrire
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : canDirections ? (
                <a
                  href={mapsDirectionsUrl(address!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={iconActionClass}
                  aria-label="Itinéraire"
                >
                  <Map className="size-4" aria-hidden />
                </a>
              ) : (
                <a
                  href={`mailto:${emailContact}`}
                  onClick={(e) => e.stopPropagation()}
                  className={iconActionClass}
                  aria-label="Écrire"
                >
                  <Mail className="size-4" aria-hidden />
                </a>
              ))}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "inline-flex min-h-11 min-w-0 flex-1 justify-center gap-2 px-4"
                )}
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                Appeler
              </a>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
