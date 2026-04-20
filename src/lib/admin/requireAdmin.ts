import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth-utils";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Erreur d’accès admin (fail closed) — gérer en 401/403 côté routes API. */
export class AdminAuthError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message = "Unauthorized") {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

/**
 * Vérifie la session et le rôle admin côté serveur uniquement (JWT / liste autorisée).
 * À appeler en première instruction des server actions et routes admin.
 * @throws AdminAuthError si non authentifié ou non admin
 */
export async function requireAdmin(): Promise<SupabaseClient> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AdminAuthError(401, "Unauthorized");
  if (!isAdmin(user)) throw new AdminAuthError(403, "Forbidden");
  return createServiceClient();
}

/** Pages RSC admin : refuse par défaut (redirection) si pas admin. */
export async function assertAdminOrRedirect(): Promise<SupabaseClient> {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      if (e.status === 401) redirect("/login");
      redirect("/dashboard");
    }
    throw e;
  }
}
