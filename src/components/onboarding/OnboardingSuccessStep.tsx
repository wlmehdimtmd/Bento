"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storefrontPublicUrl } from "@/lib/publicAppUrl";
import { markOnboardingComplete } from "@/lib/onboarding";

interface OnboardingSuccessStepProps {
  shopSlug: string;
  /** Si défini, marque l’onboarding comme terminé avant d’ouvrir le tableau de bord. */
  shopId?: string;
  /** Playground dev : pas de navigation dashboard réelle. */
  previewMode?: boolean;
  onPreviewFinish?: () => void;
}

export function OnboardingSuccessStep({
  shopSlug,
  shopId,
  previewMode = false,
  onPreviewFinish,
}: OnboardingSuccessStepProps) {
  const router = useRouter();
  const storeUrl = storefrontPublicUrl(shopSlug);
  const [finishing, setFinishing] = useState(false);

  async function goDashboard() {
    if (previewMode && onPreviewFinish) {
      onPreviewFinish();
      return;
    }
    if (shopId) {
      setFinishing(true);
      await markOnboardingComplete(shopId);
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-background items-center justify-center px-6">
      {/* Confetti-like illustration */}
      <div className="text-7xl mb-6 animate-bounce">🎉</div>

      <div className="text-center space-y-3 max-w-sm">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Votre vitrine est prête !
        </h1>
        <p className="text-muted-foreground">
          Partagez le lien avec vos clients ou imprimez vos QR codes.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
        <Link
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-border py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Voir ma vitrine
        </Link>

        <Button
          onClick={() => void goDashboard()}
          disabled={finishing}
          style={{ backgroundColor: "var(--primary)" }}
          className="text-primary-foreground hover:opacity-90 w-full gap-2"
          size="lg"
        >
          <LayoutDashboard className="h-4 w-4" />
          {previewMode
            ? "Fermer la simulation"
            : finishing
              ? "Finalisation…"
              : "Accéder au tableau de bord"}
        </Button>
      </div>
    </div>
  );
}
