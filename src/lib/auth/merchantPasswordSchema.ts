import { z } from "zod";

/** Règles mot de passe marchand (inscription, reset). */
export const merchantPasswordSchema = z
  .string()
  .min(10, "At least 10 characters")
  .regex(/[A-Z]/, "At least one uppercase letter")
  .regex(/[a-z]/, "At least one lowercase letter")
  .regex(/[0-9]/, "At least one number")
  .regex(/[^A-Za-z0-9]/, "At least one special character (!@#$%…)");
