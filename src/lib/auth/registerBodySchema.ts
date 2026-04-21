import { z } from "zod";

/** Aligné sur la validation client de `RegisterForm`. */
export const registerBodySchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[0-9]/, "At least one number")
    .regex(/[^A-Za-z0-9]/, "At least one special character"),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
