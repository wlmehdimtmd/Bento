"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

/**
 * Bandeau pages démo : navigation, message d’information, actions.
 */
export function DemoUnifiedTopBar() {
  return (
    <div className="border-b border-transparent bg-transparent">
      <div className="flex flex-row items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs font-medium sm:gap-3 sm:py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            aria-label="Retour à l'accueil"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/"
            aria-label="Bento Resto, accueil"
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 truncate text-left text-sm font-semibold tracking-tight text-white transition-colors hover:text-white/90 sm:gap-2 sm:text-base"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            <span className="shrink-0 select-none text-base leading-none sm:text-lg" aria-hidden>
              🍱
            </span>
            <span className="min-w-0 truncate">Bento Resto</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          <span className="inline-flex [&_button]:text-white/85 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
            <ThemeToggle />
          </span>
          <Link
            href="/login"
            className="hidden text-white underline decoration-white/40 underline-offset-2 transition-colors hover:text-white/90 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] sm:inline"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "inline-flex max-w-full transition-colors hover:bg-[#376cd5] hover:text-white dark:hover:bg-[#6fa0ff] dark:hover:text-[#111111]",
              "focus-visible:ring-bento-accent/45",
              "max-sm:min-h-10 max-sm:min-w-10 max-sm:px-3 max-sm:text-xs"
            )}
          >
            <span className="hidden sm:inline">Créer ma vitrine →</span>
            <span className="sm:hidden">Créer ma vitrine</span>
          </Link>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="border-t border-white/10 bg-black/25 px-4 py-2.5 sm:py-3"
      >
        <p className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-white/75 sm:text-xs">
          <span className="font-medium text-white">Vitrine de démonstration.</span>{" "}
          Aucune commande réelle n&apos;est enregistrée depuis cette page.{" "}
          <Link
            href="/register"
            className={cn(
              "inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-[#376cd5] hover:text-white sm:text-xs dark:hover:bg-[#6fa0ff] dark:hover:text-[#111111]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
            )}
          >
            Créez la vôtre
          </Link>{" "}
          en quelques minutes.
        </p>
      </div>
    </div>
  );
}
