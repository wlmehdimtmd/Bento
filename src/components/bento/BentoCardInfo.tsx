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
import { ShopOpenStatus } from "./ShopOpenStatus";
import type { SocialLinks } from "@/lib/types";
import { SHOP_INFO_DESCRIPTION_MOBILE_MAX_CHARS } from "@/lib/constants";
import { useLocale } from "@/components/i18n/LocaleProvider";

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
  fulfillmentModes?: string[];
  openingHoursJson?: unknown | null;
  openingTimezone?: string;
  openOnPublicHolidays?: boolean;
}

function mapsDirectionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function truncateDescriptionMobile(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
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
  fulfillmentModes = [],
  openingHoursJson = null,
  openingTimezone = "Europe/Paris",
  openOnPublicHolidays = false,
}: BentoCardInfoProps) {
  const { locale } = useLocale();
  const hasSingleRowHeight = cardSize === "1x1" || cardSize === "2x1";
  const contactOnStorefront = _socialLinks.show_contact_on_storefront !== false;
  const hasActions =
    contactOnStorefront && Boolean(emailContact || phone || address);
  const canDirections = Boolean(address);
  const canMail = Boolean(emailContact);
  const extraActionCount = (canDirections ? 1 : 0) + (canMail ? 1 : 0);

  const iconActionClass = cn(
    buttonVariants({ variant: "secondary", size: "icon" }),
    "shrink-0"
  );

  return (
    <BentoCard
      size={cardSize}
      omitSizeClasses={omitSizeClasses}
      disableHover
      className={cn("flex flex-col", omitSizeClasses && "h-full min-h-0", cardClassName)}
    >
      {!hasSingleRowHeight && coverUrl && (
        <div className="relative h-52 w-full shrink-0 bg-muted">
          <Image
            src={coverUrl}
            alt={shopName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 bg-[var(--color-bento-card-bg,var(--card))] p-4 [--p:1rem] [--inner-r:max(0px,calc(var(--outer-r)-var(--p)))]">
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
          <>
            <p className="hidden text-sm whitespace-pre-line text-muted-foreground md:line-clamp-6 md:block">
              {description}
            </p>
            <p className="text-sm whitespace-pre-line text-muted-foreground md:hidden">
              {truncateDescriptionMobile(description, SHOP_INFO_DESCRIPTION_MOBILE_MAX_CHARS)}
            </p>
          </>
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
                    aria-label={locale === "en" ? "Directions, email" : "Itinéraire, écrire"}
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
                        {locale === "en" ? "Directions" : "Itinéraire"}
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
                        {locale === "en" ? "Email" : "Écrire"}
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
                  aria-label={locale === "en" ? "Directions" : "Itinéraire"}
                >
                  <Map className="size-4" aria-hidden />
                </a>
              ) : (
                <a
                  href={`mailto:${emailContact}`}
                  onClick={(e) => e.stopPropagation()}
                  className={iconActionClass}
                  aria-label={locale === "en" ? "Email" : "Écrire"}
                >
                  <Mail className="size-4" aria-hidden />
                </a>
              ))}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "inline-flex min-h-11 min-w-0 flex-1 justify-center gap-2 px-4"
                )}
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                {locale === "en" ? "Call" : "Appeler"}
              </a>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
