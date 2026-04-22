import { z } from "zod";

/** Aligné sur la contrainte SQL `users_username_format_check`. */
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9_]{2,31}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Schéma pour saisie utilisateur (trim + lower avant validation). */
export const usernameSchema = z
  .string()
  .transform((s) => normalizeUsername(s))
  .pipe(
    z
      .string()
      .min(3, "ERR_USERNAME_MIN")
      .max(32, "ERR_USERNAME_MAX")
      .regex(USERNAME_REGEX, "ERR_USERNAME_FORMAT")
  );
