"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_MAIN_STEP_COUNT } from "@/lib/onboarding-flow";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ChevronLeft } from "lucide-react";

interface OnboardingShellProps {
  currentStep: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backAction?: () => void;
  subSteps?: { total: number; current: number };
  /** `wide` : aperçu Bento pleine largeur (onboarding catalogue). */
  contentVariant?: "narrow" | "wide";
  /** Permet d'aligner le footer sur une largeur différente du contenu. */
  footerContentVariant?: "narrow" | "wide";
  /** Classes additionnelles sur le conteneur scrollable interne (ex. `pb-28` pour le panier flottant). */
  contentInnerClassName?: string;
}

export function OnboardingShell({
  currentStep,
  children,
  footer,
  backAction,
  subSteps,
  contentVariant = "narrow",
  footerContentVariant,
  contentInnerClassName,
}: OnboardingShellProps) {
  const resolvedFooterVariant = footerContentVariant ?? contentVariant;

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-center h-14 border-b border-border relative px-4">
        <div className="absolute left-4">
          {backAction && (
            <button
              onClick={backAction}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        <span
          className="text-lg font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          🍱 Bento Resto
        </span>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Progress dots — même style partout */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-4">
        {subSteps
          ? Array.from({ length: subSteps.total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i + 1 === subSteps.current
                    ? "h-2 w-5 bg-[var(--primary)]"
                    : i + 1 < subSteps.current
                      ? "h-2 w-2 bg-[var(--primary)] opacity-50"
                      : "h-2 w-2 bg-muted border border-muted-foreground/20"
                )}
              />
            ))
          : Array.from({ length: ONBOARDING_MAIN_STEP_COUNT }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={cn(
                  "rounded-full transition-all duration-300",
                  step === currentStep
                    ? "h-2 w-5 bg-[var(--primary)]"
                    : step < currentStep
                      ? "h-2 w-2 bg-[var(--primary)] opacity-50"
                      : "h-2 w-2 bg-muted border border-muted-foreground/20"
                )}
              />
            ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div
          className={cn(
            contentVariant === "wide"
              ? "max-w-6xl w-full mx-auto px-3 sm:px-4 pb-6"
              : "max-w-md mx-auto px-4 pb-6",
            contentInnerClassName
          )}
        >
          {children}
        </div>
      </div>

      {/* Fixed footer */}
      {footer && (
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
          <div
            className={
              resolvedFooterVariant === "wide"
                ? "max-w-6xl w-full mx-auto px-3 sm:px-4 py-3"
                : "max-w-md mx-auto px-4 py-3"
            }
          >
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
