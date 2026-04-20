"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

interface QuickActionsProps {
  shopSlug?: string;
  shopId?: string;
}

export function QuickActions({ shopSlug, shopId }: QuickActionsProps) {
  const [qrOpen, setQrOpen] = useState(false);

  const actions = useMemo(
    () => [
      {
        key: "category" as const,
        href: shopId ? `/dashboard/shops/${shopId}/categories` : "/dashboard/categories",
        label: "+ Catégorie",
        icon: FolderPlus,
      },
      {
        key: "product" as const,
        href: shopId ? `/dashboard/shops/${shopId}/products` : "/dashboard/products",
        label: "+ Produit",
        icon: PackagePlus,
      },
      {
        key: "bundle" as const,
        href: shopId ? `/dashboard/shops/${shopId}/bundles` : "/dashboard/bundles",
        label: "+ Formule",
        icon: Gift,
      },
    ],
    [shopId]
  );
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
            Voir ma vitrine
          </a>
        )}

        {shopId && (
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="mr-1.5 h-4 w-4" />
            QR Code
          </Button>
        )}
      </div>

      {storeUrl && (
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogTitle>QR Code de votre vitrine</DialogTitle>
            <QRCodeDisplay url={storeUrl} shopName={shopSlug} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
