import { z } from "zod";

import { merchantPasswordSchema } from "@/lib/auth/merchantPasswordSchema";
import { usernameSchema } from "@/lib/auth/usernameSchema";

/** Aligné sur la validation client de `RegisterForm`. */
export const registerBodySchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(2, "Name must be at least 2 characters"),
  username: usernameSchema,
  password: merchantPasswordSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
