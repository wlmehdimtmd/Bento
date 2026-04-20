import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client dédié à `resetPasswordForEmail` en flux **implicit** (sans PKCE).
 * Le client navigateur par défaut (`@/lib/supabase/client`) force le PKCE : le
 * `code_verifier` est alors lié au navigateur qui envoie la demande — ouvrir
 * le lien depuis l’app Mail, un autre appareil ou une fenêtre privée fait
 * échouer l’échange. L’implicit envoie un lien avec jetons en `#fragment`,
 * consommés par `RecoveryHashHandler` + session SSR habituelle.
 */
export function createImplicitEmailAuthClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
