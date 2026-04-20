import { notFound } from "next/navigation";

import { OnboardingDevClient } from "./OnboardingDevClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] Onboarding — Bento Resto" };

export default function DevOnboardingPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <OnboardingDevClient />;
}
