"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutGrid, MoreHorizontal, Settings } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { AdminShopActions } from "./AdminShopActions";

interface AdminShopRowActionsProps {
  shopId: string;
  shopUrl: string;
  isActive: boolean;
}

export function AdminShopRowActions({ shopId, shopUrl, isActive }: AdminShopRowActionsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-shrink-0 items-center justify-end gap-1.5">
      <Link
        href={shopUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Ouvrir la vitrine publique"
        className={cn(
          buttonVariants({ variant: "outline", size: "xs" }),
          "inline-flex gap-1.5 font-normal"
        )}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Vitrine</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "outline", size: "icon-xs" }))}
          aria-label="Autres actions pour cette boutique"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Boutique</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/admin/shops/${shopId}/edit`);
              }}
            >
              <Settings className="h-4 w-4" aria-hidden />
              Infos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/admin/shops/${shopId}/manage`);
              }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Contenu
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/admin/shops/${shopId}/settings`);
              }}
            >
              <Settings className="h-4 w-4" aria-hidden />
              Config vitrine
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push(`/admin/shops/${shopId}/vitrine/mise-en-page`);
              }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Mise en page
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AdminShopActions shopId={shopId} isActive={isActive} />
    </div>
  );
}
