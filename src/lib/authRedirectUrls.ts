import { publicAppUrl } from "@/lib/publicAppUrl";

/**
 * Chemins à déclarer dans Supabase (Redirect URLs), en absolu par origine :
 * `AUTH_CALLBACK_RELATIVE`, `AUTH_RESET_PASSWORD_RELATIVE`.
 */
/** PKCE après email (inscription, etc.). */
export const AUTH_CALLBACK_RELATIVE = "/api/auth/callback";

/** Flux « mot de passe oublié ». */
export const AUTH_RESET_PASSWORD_RELATIVE = "/reset-password";

export function joinAppOrigin(origin: string, path: string): string {
  const base = origin.replace(/\/$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}

/** Origine du navigateur (localhost, preview Vercel, prod). */
export function authRedirectOriginFromBrowser(): string {
  if (typeof window === "undefined") return publicAppUrl;
  return window.location.origin;
}

/** Valeur de `redirectTo` pour `resetPasswordForEmail` (voir `recoveryEmailClient.ts`). */
export function buildResetPasswordRedirectTo(): string {
  return joinAppOrigin(authRedirectOriginFromBrowser(), AUTH_RESET_PASSWORD_RELATIVE);
}
