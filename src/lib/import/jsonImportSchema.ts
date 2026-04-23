import { z } from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Le nom de catégorie est requis."),
  description: z.string().trim().max(120).optional(),
  icon_emoji: z.string().trim().min(1).max(8).optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Le nom du produit est requis."),
  description: z.string().trim().max(500).optional(),
  price: z.number().positive("Le prix du produit doit être > 0."),
  category_name: z.string().trim().min(1, "Le champ category_name est requis."),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  option_label: z.string().trim().max(120).optional(),
  option_mode: z.enum(["none", "free", "paid"]).optional(),
  option_price_delta: z.number().min(0).optional(),
  option_choices: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  is_available: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
});

const bundleSlotSchema = z.object({
  category_name: z
    .string()
    .trim()
    .min(1, "Le champ category_name est requis pour chaque slot."),
  quantity: z.number().int().min(1, "La quantité d'un slot doit être >= 1."),
  label: z.string().trim().max(120).optional(),
});

const bundleSchema = z.object({
  name: z.string().trim().min(1, "Le nom de formule est requis."),
  description: z.string().trim().max(500).optional(),
  price: z.number().positive("Le prix de la formule doit être > 0."),
  is_active: z.boolean().optional(),
  slots: z.array(bundleSlotSchema).min(1, "Une formule doit contenir au moins 1 slot."),
});

export const strictMenuImportSchema = z.object({
  categories: z.array(categorySchema).default([]),
  products: z.array(productSchema).default([]),
  bundles: z.array(bundleSchema).default([]),
});

export type StrictMenuImportPayload = z.infer<typeof strictMenuImportSchema>;

export type JsonImportParseResult =
  | { ok: true; data: StrictMenuImportPayload }
  | { ok: false; errors: string[] };

export function parseStrictMenuImportJson(raw: string): JsonImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errors: ["JSON invalide : impossible de parser le contenu collé."],
    };
  }

  const result = strictMenuImportSchema.safeParse(parsed);
  if (result.success) {
    return { ok: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "racine";
    return `${path}: ${issue.message}`;
  });
  return { ok: false, errors };
}
