import { createClient } from "@/lib/supabase/server";
import { fetchLandingDemoHero } from "@/lib/fetchLandingDemoHero";
import { LandingPageClient } from "./LandingPageClient";

/** Rafraîchir l’aperçu quand la démo admin (miroir) change — sans rebuild. */
export const revalidate = 60;

export default async function LandingPage() {
  const supabase = await createClient();
  const hero = await fetchLandingDemoHero(supabase);
  return <LandingPageClient hero={hero} />;
}
