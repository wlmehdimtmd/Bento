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
        <div className="flex min-w-0 flex-1 items-center">
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
              buttonVariants({ variant: "default", size: "sm" }),
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
            className="font-medium text-white underline decoration-white/45 underline-offset-2 transition-colors hover:text-white/90"
          >
            Créez la vôtre
          </Link>{" "}
          en quelques minutes.
        </p>
      </div>
    </div>
  );
}
