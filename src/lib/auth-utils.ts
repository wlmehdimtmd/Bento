import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Admin : uniquement `app_metadata.user_role` (hook / serveur Supabase).
 * Liste d’emails optionnelle via `ADMIN_EMAILS` (séparés par des virgules), jamais en dur dans le code.
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.user_role as string | undefined;
  if (role === "admin" || role === "super_admin") return true;

  const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
  if (!raw) return false;
  const allow = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  const email = user.email?.toLowerCase() ?? "";
  return allow.has(email);
}

function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Résout le rôle admin de façon robuste:
 * 1) JWT/app_metadata ou allowlist env (isAdmin)
 * 2) fallback sur la colonne `users.role` en base
 */
export async function resolveIsAdmin(
  supabase: SupabaseClient,
  user: User | null
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (error) {
    console.error("[auth] resolveIsAdmin users.role lookup failed:", error);
    return false;
  }

  return isAdminRole(data?.role);
}
