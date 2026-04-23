"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CartBadge } from "@/components/cart/CartBadge";
import { dispatchStorefrontNavigateHome } from "@/lib/storefrontNav";
import { ThemeToggle } from "./ThemeToggle";

interface PublicHeaderProps {
  shopName?: string;
  shopLogo?: string | null;
  shopSlug?: string;
}

export function PublicHeader({
  shopName,
  shopLogo,
  shopSlug,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const href = shopSlug ? `/${shopSlug}` : "/";

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!shopSlug) return;
    const targetPath = `/${shopSlug}`;
    if (pathname !== targetPath) return;

    const q = new URLSearchParams(window.location.search);
    const onOrderSuccess = q.get("order") === "success" && Boolean(q.get("id"));
    if (onOrderSuccess) return;

    e.preventDefault();
    dispatchStorefrontNavigateHome();
  }

  return (
    <header className="z-40 flex w-full justify-center px-4 py-2 text-foreground">
      <div className="inline-flex h-12 w-fit max-w-[416px] min-w-0 items-center gap-2 rounded-[999px] bg-card/90 px-2 py-1 shadow-sm backdrop-blur-[4px] dark:bg-[rgba(0,0,0,0.7)] dark:text-[rgba(255,255,255,1)] sm:gap-3 sm:px-3 md:max-w-[512px]">
        {/* Logo + Shop name — même URL : retour grille catégories (StoreView écoute l’événement). */}
        <Link
          href={href}
          onClick={handleLogoClick}
          className="flex w-full min-w-0 flex-1 items-center gap-2 overflow-hidden text-foreground transition-colors hover:text-foreground/80 sm:gap-3"
        >
          {shopLogo ? (
            <Image
              src={shopLogo}
              alt={shopName ?? "Logo"}
              width={36}
              height={36}
              className="rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-lg text-white">
              🍱
            </span>
          )}
          <span
            className="truncate text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {shopName ?? "Bento Resto"}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <CartBadge />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
