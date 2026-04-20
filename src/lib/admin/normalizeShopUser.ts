/** Supabase peut renvoyer la relation `users` comme objet ou tableau selon le schéma. */
export function normalizeShopOwner(users: unknown): {
  email: string;
  full_name: string | null;
} | null {
  if (!users) return null;
  if (Array.isArray(users)) {
    const first = users[0] as { email?: string; full_name?: string | null } | undefined;
    if (!first?.email) return null;
    return { email: first.email, full_name: first.full_name ?? null };
  }
  const o = users as { email?: string; full_name?: string | null };
  if (!o.email) return null;
  return { email: o.email, full_name: o.full_name ?? null };
}
