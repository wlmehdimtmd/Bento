"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DemoUnifiedTopBarProps {
  /** Texte après « — », visible à partir du breakpoint `md`. */
  demoDetailMd: string;
}

/**
 * Bandeau unique pages démo : navigation, contexte mode démo, accroche courte (sm–md), actions.
 */
export function DemoUnifiedTopBar({ demoDetailMd }: DemoUnifiedTopBarProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 text-xs font-medium text-foreground sm:gap-3 sm:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="flex shrink-0 items-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Accueil</span>
        </Link>
        <span className="hidden shrink-0 text-muted-foreground/60 sm:block" aria-hidden>
          ·
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 truncate text-muted-foreground">
            <span className="font-semibold text-foreground">Mode démo</span>
            <span className="hidden sm:inline md:hidden">· Créez la vôtre en 5 min</span>
            <span className="hidden md:inline">{` — ${demoDetailMd}`}</span>
          </span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/login"
          className="hidden text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary/90 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 sm:inline"
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
  );
}
