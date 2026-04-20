import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/utils";

/** Origine publique de l’app : URL canonique pour les liens email (évite localhost en prod). */
export function resolvePublicAppOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}

/** URL absolue utilisée comme `emailRedirectTo` après inscription (PKCE → callback). */
export function buildAuthEmailConfirmationRedirectUrl(request: Request): string {
  const base = resolvePublicAppOrigin(request);
  const u = new URL("/api/auth/callback", base);
  u.searchParams.set("next", "/onboarding/shop");
  return u.toString();
}

export function buildDefaultShopInsert(
  ownerId: string,
  fullName: string | null | undefined
): {
  owner_id: string;
  name: string;
  slug: string;
  type: "other";
} {
  const raw = (fullName ?? "").trim();
  const first = raw.split(/\s+/)[0] ?? "Ma";
  const shopName = `${first}'s Shop`;
  const baseSlug = slugify(shopName);
  const slug = `${baseSlug}-${ownerId.slice(0, 6)}`;
  return {
    owner_id: ownerId,
    name: shopName,
    slug,
    type: "other",
  };
}

/**
 * Garantit une boutique « placeholder » pour un propriétaire sans ligne `shops`.
 * Utilisé après inscription immédiate (session) ou après confirmation email (callback).
 */
export async function ensureDefaultShopForOwner(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  fullName: string | null | undefined
): Promise<
  { ok: true; shopId: string; created: boolean } | { ok: false; error: string }
> {
  const { data: existing, error: selectError } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    return { ok: false, error: selectError.message };
  }

  if (existing?.id) {
    return { ok: true, shopId: String(existing.id), created: false };
  }

  const row = buildDefaultShopInsert(ownerId, fullName);
  const { data, error } = await supabase
    .from("shops")
    .insert(row)
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "insert_failed" };
  }

  return { ok: true, shopId: String(data.id), created: true };
}

/** Limite les redirections internes après auth (évite open redirect `//host`, CRLF, etc.). */
export function sanitizeAuthNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (next == null || typeof next !== "string") return fallback;
  const t = next.trim();
  if (t.length === 0) return fallback;
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (/[\r\n\0]/.test(t)) return fallback;
  return t;
}
