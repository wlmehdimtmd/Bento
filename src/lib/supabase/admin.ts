import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Client Supabase service role — serveur uniquement (jamais importer dans du code client). */
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
