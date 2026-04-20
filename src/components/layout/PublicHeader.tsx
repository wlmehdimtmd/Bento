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
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border/60 bg-white/85 backdrop-blur-md dark:bg-black/85">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
        {/* Logo + Shop name — même URL : retour grille catégories (StoreView écoute l’événement). */}
        <Link
          href={href}
          onClick={handleLogoClick}
          className="flex min-w-0 items-center gap-3"
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
            className="truncate text-lg font-semibold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {shopName ?? "Bento Resto"}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <CartBadge />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
