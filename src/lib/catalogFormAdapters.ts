import { z } from "zod";

import type { TabCompletionStatus } from "@/lib/catalogLanguages";

/** ─── Catégorie ─────────────────────────────────────────────── */

export const categoryFormSchema = z.object({
  translations: z.object({
    fr: z.object({
      name: z.string().min(1, "Nom requis"),
      description: z.string().max(32, "Maximum 32 caractères").optional(),
    }),
    en: z.object({
      name: z.string().max(120).optional(),
      description: z.string().max(32, "Maximum 32 caractères").optional(),
    }),
  }),
  icon_emoji: z.string().optional(),
  is_active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/** Ligne catégorie minimale pour les valeurs par défaut (évite import circulaire). */
export type CategoryRowInput = {
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  icon_emoji: string;
  is_active: boolean;
};

export function categoryDefaultFormValues(initial?: CategoryRowInput): CategoryFormValues {
  const nameFr = (initial?.name_fr ?? initial?.name ?? "").trim();
  const descFr = (initial?.description_fr ?? initial?.description ?? "").trim();
  return {
    translations: {
      fr: {
        name: nameFr,
        description: descFr,
      },
      en: {
        name: (initial?.name_en ?? "").trim(),
        description: (initial?.description_en ?? "").trim(),
      },
    },
    icon_emoji: initial?.icon_emoji ?? "📦",
    is_active: initial?.is_active ?? true,
  };
}

export function categoryFormToSavePayload(
  values: CategoryFormValues,
  shopId: string,
  displayOrder: number
) {
  const nameFr = values.translations.fr.name.trim();
  const nameEn = (values.translations.en.name ?? "").trim() || null;
  const descFr = values.translations.fr.description?.trim() || null;
  const descEn = (values.translations.en.description ?? "").trim() || null;
  return {
    shop_id: shopId,
    name: nameFr,
    name_fr: nameFr,
    name_en: nameEn,
    description: descFr,
    description_fr: descFr,
    description_en: descEn,
    icon_emoji: values.icon_emoji || "📦",
    is_active: values.is_active,
    display_order: displayOrder,
  };
}

export function categoryCompletion(values: CategoryFormValues): Record<string, TabCompletionStatus> {
  const frName = values.translations.fr.name.trim();
  const enName = (values.translations.en.name ?? "").trim();
  const enDesc = (values.translations.en.description ?? "").trim();

  const fr: TabCompletionStatus = frName.length === 0 ? "invalid" : "complete";
  const en: TabCompletionStatus =
    enName.length === 0 && enDesc.length === 0 ? "empty" : enName.length > 0 ? "complete" : "partial";

  return { fr, en };
}

/** ─── Produit ───────────────────────────────────────────────── */

export const productFormSchema = z.object({
  category_id: z.string().min(1, "Catégorie requise"),
  option_mode: z.enum(["none", "free", "paid"]),
  option_choices: z.array(z.string().trim().min(1).max(120)).max(20),
  translations: z.object({
    fr: z.object({
      name: z.string().min(1, "Nom requis"),
      description: z.string().optional(),
      option_label: z.string().optional(),
    }),
    en: z.object({
      name: z.string().max(200).optional(),
      description: z.string().optional(),
      option_label: z.string().max(200).optional(),
    }),
  }),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  option_price_delta: z.number().min(0, "Le supplément doit être positif ou nul"),
  is_available: z.boolean(),
  display_order: z.number().int().min(0),
}).superRefine((data, ctx) => {
  if (data.option_mode === "none") return;

  const hasFrLabel = (data.translations.fr.option_label ?? "").trim().length > 0;
  if (!hasFrLabel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["translations", "fr", "option_label"],
      message: "Libellé d'option requis",
    });
  }

  if (data.option_mode !== "paid") return;
  if (data.option_price_delta <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option_price_delta"],
      message: "Le supplément doit être supérieur à 0",
    });
  }

  if (data.option_choices.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option_choices"],
      message: "Ajoutez au moins une réponse proposée",
    });
  }
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export type ProductRowInput = {
  category_id: string;
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  price: number;
  option_label: string | null;
  option_label_fr?: string | null;
  option_label_en?: string | null;
  option_mode?: "none" | "free" | "paid" | null;
  option_price_delta?: number | null;
  option_choices?: string[] | null;
  is_available: boolean;
  display_order: number;
};

function normalizeOptionMode(value: unknown): "none" | "free" | "paid" {
  return value === "free" || value === "paid" ? value : "none";
}

export function productDefaultFormValues(
  initial?: ProductRowInput,
  opts?: { defaultCategoryId?: string; nextDisplayOrder?: number }
): ProductFormValues {
  const price =
    initial?.price != null && Number.isFinite(initial.price) && initial.price > 0
      ? initial.price
      : 0.01;
  return {
    category_id: initial?.category_id ?? opts?.defaultCategoryId ?? "",
    option_mode: normalizeOptionMode(initial?.option_mode),
    option_choices: Array.isArray(initial?.option_choices)
      ? initial.option_choices.filter((choice): choice is string => typeof choice === "string" && choice.trim().length > 0)
      : [],
    translations: {
      fr: {
        name: (initial?.name_fr ?? initial?.name ?? "").trim(),
        description: (initial?.description_fr ?? initial?.description ?? "").trim(),
        option_label: (initial?.option_label_fr ?? initial?.option_label ?? "").trim(),
      },
      en: {
        name: (initial?.name_en ?? "").trim(),
        description: (initial?.description_en ?? "").trim(),
        option_label: (initial?.option_label_en ?? "").trim(),
      },
    },
    price,
    option_price_delta: (() => {
      const raw = Number(initial?.option_price_delta ?? 0);
      return Number.isFinite(raw) && raw >= 0 ? raw : 0;
    })(),
    is_available: initial?.is_available ?? true,
    display_order: initial?.display_order ?? opts?.nextDisplayOrder ?? 0,
  };
}

export function productFormToSavePayload(
  values: ProductFormValues,
  imageUrl: string | null,
  tags: string[]
) {
  const nameFr = values.translations.fr.name.trim();
  const nameEn = (values.translations.en.name ?? "").trim() || null;
  const descFr = values.translations.fr.description?.trim() || null;
  const descEn = (values.translations.en.description ?? "").trim() || null;
  const optFr = values.translations.fr.option_label?.trim() || null;
  const optEn = (values.translations.en.option_label ?? "").trim() || null;
  const optionMode = values.option_mode;
  const optionLabelFr = optionMode === "none" ? null : optFr;
  const optionLabelEn = optionMode === "none" ? null : optEn;
  const optionPriceDelta = optionMode === "paid" ? values.option_price_delta : 0;
  return {
    category_id: values.category_id,
    name: nameFr,
    name_fr: nameFr,
    name_en: nameEn,
    description: descFr,
    description_fr: descFr,
    description_en: descEn,
    price: values.price,
    image_url: imageUrl,
    tags,
    option_label: optionLabelFr,
    option_label_fr: optionLabelFr,
    option_label_en: optionLabelEn,
    option_mode: optionMode,
    option_price_delta: optionPriceDelta,
    option_choices: optionMode === "none" ? [] : values.option_choices.map((choice) => choice.trim()).filter((choice) => choice.length > 0),
    is_available: values.is_available,
    display_order: values.display_order,
  };
}

export function productCompletion(values: ProductFormValues): Record<string, TabCompletionStatus> {
  const frName = values.translations.fr.name.trim();
  const enName = (values.translations.en.name ?? "").trim();
  const enDesc = (values.translations.en.description ?? "").trim();
  const enOpt = (values.translations.en.option_label ?? "").trim();

  const fr: TabCompletionStatus = frName.length === 0 ? "invalid" : "complete";
  const en: TabCompletionStatus =
    enName.length === 0 && enDesc.length === 0 && enOpt.length === 0
      ? "empty"
      : enName.length > 0
        ? "complete"
        : "partial";

  return { fr, en };
}

/** ─── Label boutique ────────────────────────────────────────── */

export const shopLabelFormSchema = z.object({
  translations: z.object({
    fr: z.object({
      label: z.string().min(1, "Nom requis"),
    }),
    en: z.object({
      label: z.string().max(200).optional(),
    }),
  }),
});

export type ShopLabelFormValues = z.infer<typeof shopLabelFormSchema>;

export function shopLabelCompletion(values: ShopLabelFormValues): Record<string, TabCompletionStatus> {
  const fr = values.translations.fr.label.trim();
  const en = (values.translations.en.label ?? "").trim();
  return {
    fr: fr.length === 0 ? "invalid" : "complete",
    en: en.length === 0 ? "empty" : "complete",
  };
}

/** ─── Bundle (corps + slots EN séparés dans le formulaire) ─── */

export const bundleMainFormSchema = z.object({
  translations: z.object({
    fr: z.object({
      name: z.string().min(1, "Nom requis"),
      description: z.string().optional(),
    }),
    en: z.object({
      name: z.string().max(200).optional(),
      description: z.string().optional(),
    }),
  }),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  is_active: z.boolean(),
});

export type BundleMainFormValues = z.infer<typeof bundleMainFormSchema>;

export const bundleSlotEnSchema = z.object({
  id: z.string().optional(),
  category_id: z.string().min(1, "Catégorie requise"),
  quantity: z.number().int().min(1, "Minimum 1"),
  display_order: z.number().int().min(0),
  label_en: z.string().max(200).optional(),
  excluded_product_ids: z.array(z.string().uuid()),
});

export const bundleSlotsFormSchema = z.object({
  slots: z.array(bundleSlotEnSchema).min(1, "Ajoutez au moins un choix à la formule"),
});

export type BundleSlotsFormValues = z.infer<typeof bundleSlotsFormSchema>;

export function bundleMainDefaultValues(initial?: {
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  price: number;
  is_active: boolean;
}): BundleMainFormValues {
  const price =
    initial?.price != null && Number.isFinite(initial.price) && initial.price > 0
      ? initial.price
      : 0.01;
  return {
    translations: {
      fr: {
        name: (initial?.name_fr ?? initial?.name ?? "").trim(),
        description: (initial?.description_fr ?? initial?.description ?? "").trim(),
      },
      en: {
        name: (initial?.name_en ?? "").trim(),
        description: (initial?.description_en ?? "").trim(),
      },
    },
    price,
    is_active: initial?.is_active ?? true,
  };
}

export const bundleFormSchema = bundleMainFormSchema.merge(bundleSlotsFormSchema);

export type BundleCatalogFormValues = z.infer<typeof bundleFormSchema>;

export type BundleSlotInput = {
  id?: string;
  category_id: string;
  quantity: number;
  display_order: number;
  label_en?: string | null;
  excluded_product_ids?: string[];
};

export function bundleDefaultFormValues(initial?: {
  name: string;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  price: number;
  is_active: boolean;
  slots?: BundleSlotInput[];
}): BundleCatalogFormValues {
  return {
    ...bundleMainDefaultValues(initial),
    slots:
      initial?.slots && initial.slots.length > 0
        ? initial.slots.map((s, i) => ({
            id: s.id,
            category_id: s.category_id,
            quantity: s.quantity,
            display_order: s.display_order ?? i,
            label_en: s.label_en ?? "",
            excluded_product_ids: Array.isArray(s.excluded_product_ids)
              ? s.excluded_product_ids
              : [],
          }))
        : [{ category_id: "", quantity: 1, display_order: 0, label_en: "", excluded_product_ids: [] }],
  };
}

export function shopLabelDefaultFormValues(initial?: {
  label: string;
  label_fr?: string | null;
  label_en?: string | null;
}): ShopLabelFormValues {
  const fr = (initial?.label_fr ?? initial?.label ?? "").trim();
  return {
    translations: {
      fr: { label: fr },
      en: { label: (initial?.label_en ?? "").trim() },
    },
  };
}

export function shopLabelFormToSavePayload(values: ShopLabelFormValues) {
  const labelFr = values.translations.fr.label.trim();
  const labelEn = (values.translations.en.label ?? "").trim() || null;
  return {
    label: labelFr,
    label_fr: labelFr,
    label_en: labelEn,
  };
}

export function bundleMainCompletion(values: BundleMainFormValues): Record<string, TabCompletionStatus> {
  const frName = values.translations.fr.name.trim();
  const enName = (values.translations.en.name ?? "").trim();
  const enDesc = (values.translations.en.description ?? "").trim();
  const fr: TabCompletionStatus = frName.length === 0 ? "invalid" : "complete";
  const en: TabCompletionStatus =
    enName.length === 0 && enDesc.length === 0 ? "empty" : enName.length > 0 ? "complete" : "partial";
  return { fr, en };
}

export function bundleMainToBundlePayloadPart(
  values: BundleMainFormValues,
  shopId: string,
  imageUrl: string | null
) {
  const nameFr = values.translations.fr.name.trim();
  const nameEn = (values.translations.en.name ?? "").trim() || null;
  const descFr = values.translations.fr.description?.trim() || null;
  const descEn = (values.translations.en.description ?? "").trim() || null;
  return {
    shop_id: shopId,
    name: nameFr,
    name_fr: nameFr,
    name_en: nameEn,
    description: descFr,
    description_fr: descFr,
    description_en: descEn,
    price: values.price,
    image_url: imageUrl,
    is_active: values.is_active,
  };
}
