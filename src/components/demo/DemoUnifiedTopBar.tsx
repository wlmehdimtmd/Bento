"use client";

import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { STOREFRONT_CART_CTA_CLASSNAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Bandeau pages démo : message d’information, puis header pill (navigation SaaS).
 */
export function DemoUnifiedTopBar() {
  return (
    <div className="flex flex-col items-stretch gap-[4px]">
      <div className="flex w-full justify-center">
        <div
          role="status"
          aria-live="polite"
          className="w-full overflow-hidden rounded-[var(--bento-outer-r)] bg-background px-[8px] py-[4px] text-center"
        >
          <p className="text-balance text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            <span className="font-semibold text-foreground">Vitrine de démonstration.</span>{" "}
            Aucune commande réelle n&apos;est enregistrée depuis cette page.{" "}
            <Link
              href="/register"
              className={cn(
                "inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-[#376cd5] hover:text-white sm:text-xs dark:hover:bg-[#6fa0ff] dark:hover:text-[#111111]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              )}
            >
              Créez la vôtre
            </Link>{" "}
            en quelques minutes.
          </p>
        </div>
      </div>

      <div className="flex w-full justify-center text-foreground">
        <div className="flex w-full max-w-[min(100%,516px)] min-w-0 items-center gap-1 rounded-[999px] bg-card/90 px-[4px] py-1 shadow-sm backdrop-blur-[4px] dark:backdrop-blur-[8px] sm:gap-2">
          <Link
            href="/"
            aria-label="Retour à l'accueil"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/"
            aria-label="Bento Resto, accueil"
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-lg py-1 text-foreground transition-colors hover:text-foreground/80 sm:gap-2"
          >
            <span className="shrink-0 text-base leading-none sm:text-lg" aria-hidden>
              🍱
            </span>
            <span
              className="min-w-0 flex-1 truncate text-left text-base font-semibold sm:text-lg"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              Bento Resto
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <ThemeToggle />
            <Link
              href="/login"
              aria-label="Se connecter"
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
            >
              <LogIn className="size-4 shrink-0" aria-hidden />
            </Link>
          </div>
          <Link
            href="/register"
            className={cn(STOREFRONT_CART_CTA_CLASSNAME, "ms-auto shrink-0 rounded-[999px]")}
          >
            <span className="font-semibold">Commencer</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
