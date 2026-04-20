import Link from "next/link";

import { cn } from "@/lib/utils";

const onest = { fontFamily: "var(--font-onest)" } as const;

export type AppBrandMarkVariant = "header" | "auth";

type AppBrandMarkProps = {
  variant?: AppBrandMarkVariant;
  className?: string;
};

/**
 * Marque « 🍱 Bento Resto » — couleurs via le thème (`text-foreground`).
 * - `header` : emoji + libellé sur tous les breakpoints (`truncate` si espace limité).
 * - `auth` : même rendu que les cartes login / register (titre centré).
 */
export function AppBrandMark({ variant = "header", className }: AppBrandMarkProps) {
  if (variant === "auth") {
    return (
      <Link
        href="/"
        className={cn(
          "text-3xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity",
          className,
        )}
        style={onest}
        aria-label="Bento Resto — accueil"
      >
        🍱 Bento Resto
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center gap-2 text-foreground hover:opacity-90 transition-opacity",
        className,
      )}
      aria-label="Bento Resto — accueil"
    >
      <span className="text-xl leading-none sm:text-2xl shrink-0" aria-hidden>
        🍱
      </span>
      <span
        className="min-w-0 truncate text-lg font-bold tracking-tight"
        style={onest}
      >
        Bento Resto
      </span>
    </Link>
  );
}
