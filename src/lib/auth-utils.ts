import type { User } from "@supabase/supabase-js";

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
