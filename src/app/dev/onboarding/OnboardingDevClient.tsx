"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { OnboardingShopStep } from "@/components/onboarding/OnboardingShopStep";
import { OnboardingCatalogWorkspace } from "@/components/onboarding/OnboardingCatalogWorkspace";
import { OnboardingSuccessStep } from "@/components/onboarding/OnboardingSuccessStep";
import { OnboardingRuntimeProvider } from "@/components/onboarding/OnboardingRuntimeContext";
import type { OnboardingPreviewDestination } from "@/lib/onboarding-flow";
import { Button } from "@/components/ui/button";
import { ONBOARDING_MAIN_STEP_ORDER } from "@/lib/onboarding-flow";
import type { PublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import { coerceStorefrontThemeOverrides } from "@/lib/storefrontTheme";

const DEV_SHOP_ID = "00000000-0000-4000-8000-000000000001";

const MOCK_SHOP_INITIAL = {
  name: "Marie's Shop",
  slug: "marie-shop-dev",
  description: "",
  address: "",
  phone: "",
  email_contact: "",
  logo_url: null as string | null,
  cover_image_url: null as string | null,
  google_maps_url: "",
  social_links: {} as Record<string, unknown>,
  fulfillment_modes: ["takeaway"] as string[],
};

const MOCK_CATALOG_PAYLOAD: PublicShopPagePayload = {
  shop: {
    id: DEV_SHOP_ID,
    name: "Atelier Dev",
    slug: "marie-shop-dev",
    description: "Vitrine de test pour le playground.",
    logo_url: null,
    cover_image_url: null,
    address: null,
    phone: null,
    email_contact: null,
    social_links: {},
    fulfillment_modes: ["takeaway"],
    opening_hours: null,
    opening_timezone: "Europe/Paris",
    open_on_public_holidays: false,
  },
  categories: [
    {
      id: "preview-cat-sushi",
      name: "Sushi",
      icon_emoji: "🍣",
      cover_image_url: null,
      description: null,
      productCount: 0,
    },
    {
      id: "preview-cat-boisson",
      name: "Boissons",
      icon_emoji: "🍵",
      cover_image_url: null,
      description: null,
      productCount: 0,
    },
  ],
  bundles: [],
  bundlesMenuGrouped: false,
  reviews: null,
  storefrontPhotos: [],
  savedStorefrontLayout: null,
  storefrontThemeKey: "turquoise",
  storefrontThemeOverrides: coerceStorefrontThemeOverrides(null),
  shopLabels: [],
  stripeAccountId: null,
};

type DevScreen = "hub" | "shop" | "catalog" | "success";

function destToScreen(dest: OnboardingPreviewDestination): DevScreen {
  if (dest === "dashboard") return "hub";
  if (dest === "success") return "success";
  if (dest === "shop") return "shop";
  if (dest === "catalog") return "catalog";
  return "catalog";
}

export function OnboardingDevClient() {
  const [screen, setScreen] = useState<DevScreen>("hub");

  const previewNavigate = useCallback((dest: OnboardingPreviewDestination) => {
    if (dest === "dashboard") {
      toast.message("Simulation : retour accueil (pas de tableau de bord).");
    }
    setScreen(destToScreen(dest));
  }, []);

  const providerValue = useMemo(
    () =>
      ({
        mode: "preview" as const,
        previewNavigate,
      }),
    [previewNavigate]
  );

  const hub = (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <Link
          href="/dev"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex w-full justify-center sm:w-auto",
          )}
        >
          Hub dev
        </Link>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <strong className="font-semibold">Mode développement</strong> — aucun compte, aucun
          appel Supabase. Les données sont locales au navigateur.
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Playground onboarding
        </h1>
        <p className="text-sm text-muted-foreground">
          Flux : vitrine (4 sous-étapes) puis catalogue. Le bouton « catalog » ouvre le catalogue
          sans passer par la vitrine.
        </p>
        <ul className="flex flex-col gap-2">
          {ONBOARDING_MAIN_STEP_ORDER.map((step) => (
            <li key={step}>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setScreen(step)}
              >
                {step}
              </Button>
            </li>
          ))}
          <li>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setScreen("success")}
            >
              success (écran final)
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );

  if (screen === "hub") {
    return hub;
  }

  return (
    <OnboardingRuntimeProvider value={providerValue}>
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dev"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Hub dev
          </Link>
        </div>
      </div>
      {screen === "shop" && (
        <OnboardingShopStep shopId={DEV_SHOP_ID} initialData={MOCK_SHOP_INITIAL} />
      )}
      {screen === "catalog" && (
        <OnboardingCatalogWorkspace
          shopId={DEV_SHOP_ID}
          payload={MOCK_CATALOG_PAYLOAD}
          initialProducts={[]}
        />
      )}
      {screen === "success" && (
        <OnboardingSuccessStep
          shopSlug="maison-demo"
          previewMode
          onPreviewFinish={() => setScreen("hub")}
        />
      )}
    </OnboardingRuntimeProvider>
  );
}
