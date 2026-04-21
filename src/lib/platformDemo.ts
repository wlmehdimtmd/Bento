import type { SupabaseClient } from "@supabase/supabase-js";

const PLATFORM_ROW_ID = "default";

/**
 * Lit demo_shop_id depuis platform_settings (RLS select public).
 * Retourne null si table absente / erreur (démo intégrée par défaut).
 */
export async function getDemoShopId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("demo_shop_id")
    .eq("id", PLATFORM_ROW_ID)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getDemoShopId]", error.message);
    }
    return null;
  }

  const row = data as { demo_shop_id: string | null } | null;
  return row?.demo_shop_id ?? null;
}

/**
 * Identifiant de la boutique dont le contenu est servi sur `/demo` et le hero landing :
 * miroir explicite (`platform_settings.demo_shop_id`), sinon null (démo React statique).
 */
export async function resolveDemoSourceShopId(supabase: SupabaseClient): Promise<string | null> {
  return getDemoShopId(supabase);
}
