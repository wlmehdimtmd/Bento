import { publicAppUrl } from "@/lib/publicAppUrl";

/** PKCE après email (inscription, etc.) — à autoriser dans Supabase Redirect URLs. */
export const AUTH_CALLBACK_RELATIVE = "/api/auth/callback";

/** Flux « mot de passe oublié » — à autoriser dans Supabase Redirect URLs. */
export const AUTH_RESET_PASSWORD_RELATIVE = "/reset-password";

/**
 * Chemins relatifs à ajouter dans le dashboard Supabase pour chaque origine
 * (ex. `http://localhost:3000` et `https://…vercel.app`) : une entrée par URL absolue.
 */
export const SUPABASE_REDIRECT_RELATIVE_PATHS = [
  AUTH_CALLBACK_RELATIVE,
  AUTH_RESET_PASSWORD_RELATIVE,
] as const;

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
