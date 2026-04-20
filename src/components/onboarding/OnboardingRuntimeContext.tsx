"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

import { markOnboardingComplete } from "@/lib/onboarding";
import {
  pushOnboardingStep,
  type OnboardingPreviewDestination,
  type OnboardingRouteStep,
} from "@/lib/onboarding-flow";

export type { OnboardingPreviewDestination };

export type OnboardingRuntimeContextValue = {
  mode: "live" | "preview";
  /** En mode preview, remplace router.push / fin de parcours. */
  previewNavigate?: (dest: OnboardingPreviewDestination) => void;
};

const defaultCtx: OnboardingRuntimeContextValue = { mode: "live" };

export const OnboardingRuntimeContext =
  createContext<OnboardingRuntimeContextValue>(defaultCtx);

export function OnboardingRuntimeProvider({
  value,
  children,
}: {
  value: OnboardingRuntimeContextValue;
  children: React.ReactNode;
}) {
  const merged = useMemo<OnboardingRuntimeContextValue>(() => {
    if (value.mode === "preview") {
      return { mode: "preview", previewNavigate: value.previewNavigate };
    }
    return { mode: "live" };
  }, [value.mode, value.previewNavigate]);

  return (
    <OnboardingRuntimeContext.Provider value={merged}>
      {children}
    </OnboardingRuntimeContext.Provider>
  );
}

export function useOnboardingRuntime() {
  return useContext(OnboardingRuntimeContext);
}

export function useOnboardingStepNav(shopId: string) {
  const router = useRouter();
  const { mode, previewNavigate } = useOnboardingRuntime();

  return useCallback(
    (step: OnboardingRouteStep) => {
      if (mode === "preview" && previewNavigate) {
        previewNavigate(step);
      } else {
        pushOnboardingStep(router, step, shopId);
      }
    },
    [mode, previewNavigate, router, shopId]
  );
}

export function useOnboardingSkipToDashboard(shopId: string) {
  const router = useRouter();
  const { mode, previewNavigate } = useOnboardingRuntime();

  return useCallback(async () => {
    if (mode === "preview" && previewNavigate) {
      previewNavigate("dashboard");
      return;
    }
    await markOnboardingComplete(shopId);
    router.push("/dashboard");
  }, [mode, previewNavigate, router, shopId]);
}
