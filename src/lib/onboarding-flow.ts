import { isVitrineOnboardingComplete } from "@/lib/onboarding-status";

/**
 * Étapes principales affichées dans OnboardingShell (hors écran success).
 * L’ordre correspond au parcours marchand.
 */
/** Deux phases : vitrine (sous-étapes dans l’écran shop) puis catalogue unifié (aperçu Bento + édition). */
export const ONBOARDING_MAIN_STEP_ORDER = ["shop", "catalog"] as const;

export type OnboardingMainStep = (typeof ONBOARDING_MAIN_STEP_ORDER)[number];

export type OnboardingRouteStep = OnboardingMainStep | "success";

/** Utilisé par le playground dev (navigation simulée). */
export type OnboardingPreviewDestination = OnboardingRouteStep | "dashboard";

export const ONBOARDING_MAIN_STEP_COUNT = ONBOARDING_MAIN_STEP_ORDER.length;

export function mainStepIndex(step: OnboardingMainStep): number {
  return ONBOARDING_MAIN_STEP_ORDER.indexOf(step) + 1;
}

export function buildOnboardingPath(step: OnboardingRouteStep, shopId: string): string {
  const q = new URLSearchParams({ shopId }).toString();
  if (step === "success") {
    return `/onboarding/success?${q}`;
  }
  return `/onboarding/${step}?${q}`;
}

export function pushOnboardingStep(
  router: { push: (href: string) => void },
  step: OnboardingRouteStep,
  shopId: string
): void {
  router.push(buildOnboardingPath(step, shopId));
}

/**
 * Reprise dashboard → onboarding : si la phase vitrine est enregistrée
 * (`_ob_vitrine`), reprendre au choix catalogue ; sinon à l’assistant vitrine.
 */
export function resolveDashboardOnboardingResumePath(shop: {
  id: string;
  social_links: unknown;
}): string {
  if (isVitrineOnboardingComplete(shop.social_links)) {
    return buildOnboardingPath("catalog", shop.id);
  }
  return buildOnboardingPath("shop", shop.id);
}
