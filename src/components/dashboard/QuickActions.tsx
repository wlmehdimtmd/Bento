"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FolderPlus,
  PackagePlus,
  Gift,
  ExternalLink,
  QrCode,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/shop/QRCodeDisplay";
import { cn } from "@/lib/utils";
import { storefrontPublicUrl } from "@/lib/publicAppUrl";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface QuickActionsProps {
  shopSlug?: string;
  shopId?: string;
}

export function QuickActions({ shopSlug, shopId }: QuickActionsProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);

  const catalogBase = shopId ? `/dashboard/shops/${shopId}` : "/dashboard";

  const actions = [
    {
      key: "category" as const,
      href: `${catalogBase}/categories`,
      label: tr("+ Catégorie", "+ Category"),
      icon: FolderPlus,
    },
    {
      key: "product" as const,
      href: `${catalogBase}/products`,
      label: tr("+ Produit", "+ Product"),
      icon: PackagePlus,
    },
    {
      key: "bundle" as const,
      href: `${catalogBase}/bundles`,
      label: tr("+ Formule", "+ Bundle"),
      icon: Gift,
    },
  ];
  const storeUrl = shopSlug ? storefrontPublicUrl(shopSlug) : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ key, href, label, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Icon className="mr-1.5 h-4 w-4" />
            {label}
          </Link>
        ))}

        {storeUrl && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" />
            {tr("Voir ma vitrine", "View storefront")}
          </a>
        )}

        {shopId && (
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="mr-1.5 h-4 w-4" />
            {tr("QR Code", "QR code")}
          </Button>
        )}
      </div>

      {storeUrl && (
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle>{tr("QR Code de votre vitrine", "Storefront QR code")}</DialogTitle>
            <QRCodeDisplay url={storeUrl} shopName={shopSlug} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
