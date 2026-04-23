import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { FULFILLMENT_MODES } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import type { FulfillmentMode } from "@/lib/types";

const LOG_PREFIX = "[orders/create]";
const STRIPE_MAX_UNIT_PRICE_EUR = 999_999.99;

const fulfillmentValues = FULFILLMENT_MODES.map((m) => m.value) as [
  FulfillmentMode,
  ...FulfillmentMode[],
];

export const createStorefrontOrderItemSchema = z
  .object({
    isBundle: z.boolean(),
    productId: z.string().min(1),
    bundleId: z.string().min(1).nullable().optional(),
    quantity: z.number().int().positive(),
    optionValue: z.string().max(500).nullable().optional(),
    specialNote: z.string().max(2000).nullable().optional(),
    /** Si présent, doit correspondre au prix catalogue (tolérance 1 centime). */
    unitPrice: z.number().finite().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBundle && (data.bundleId == null || data.bundleId === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bundleId requis pour une formule",
        path: ["bundleId"],
      });
    }
  });

export const createStorefrontOrderBodySchema = z.object({
  shopId: z.string().uuid(),
  customer_name: z.string().trim().min(2).max(200),
  customer_phone: z.string().max(40).nullable().optional(),
  fulfillment_mode: z.enum(fulfillmentValues),
  table_number: z.string().max(80).nullable().optional(),
  delivery_address: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  items: z.array(createStorefrontOrderItemSchema).min(1),
});

export type CreateStorefrontOrderBody = z.infer<typeof createStorefrontOrderBodySchema>;

function toCents(euros: number): number {
  return Math.round(Number(euros) * 100);
}

function totalsMatchCents(orderTotalEuros: number, sumLineCents: number): boolean {
  return Math.abs(toCents(orderTotalEuros) - sumLineCents) <= 1;
}

type Fail = { ok: false; status: number; error: string };
type Ok = { ok: true; orderId: string };
export type CreateStorefrontOrderResult = Ok | Fail;

function fail(status: number, error: string): Fail {
  return { ok: false, status, error };
}

type ProductRow = {
  id: string;
  price: number;
  is_available: boolean | null;
  category_id: string;
  option_mode: string | null;
  option_price_delta: number | null;
};
type CategoryRow = { id: string; shop_id: string };
type BundleRow = {
  id: string;
  price: number;
  is_active: boolean | null;
  shop_id: string;
};

/**
 * Crée une commande `pending` + lignes depuis le panier vitrine.
 * Validation catalogue complète (prix DB, dispo, boutique active).
 * Service role uniquement — appeler depuis une route API serveur.
 */
export async function createStorefrontOrder(
  admin: SupabaseClient<Database>,
  body: CreateStorefrontOrderBody
): Promise<CreateStorefrontOrderResult> {
  const shopId = body.shopId;

  const { data: shop, error: shopErr } = await admin
    .from("shops")
    .select("id, is_active")
    .eq("id", shopId)
    .maybeSingle();

  if (shopErr) {
    console.error(LOG_PREFIX, "shop read failed", shopErr.message);
    return fail(500, "Erreur serveur.");
  }
  if (!shop) {
    return fail(404, "Boutique introuvable.");
  }
  if (!(shop.is_active ?? false)) {
    return fail(400, "Boutique introuvable ou inactive.");
  }

  const bundleIds = [
    ...new Set(
      body.items.filter((i) => i.isBundle).map((i) => i.bundleId as string)
    ),
  ];
  const productIds = [
    ...new Set(body.items.filter((i) => !i.isBundle).map((i) => i.productId)),
  ];

  const bundlesById: Record<string, BundleRow> = {};
  if (bundleIds.length > 0) {
    const { data: bundles, error: bErr } = await admin
      .from("bundles")
      .select("id, price, is_active, shop_id")
      .in("id", bundleIds);
    if (bErr || !bundles) {
      console.error(LOG_PREFIX, "bundles read failed", bErr?.message);
      return fail(500, "Erreur serveur.");
    }
    for (const b of bundles) {
      bundlesById[b.id] = b as BundleRow;
    }
    if (bundles.length !== bundleIds.length) {
      return fail(400, "Formule inconnue ou autre boutique.");
    }
  }

  const productsById: Record<string, ProductRow> = {};
  const categoryIds = new Set<string>();
  if (productIds.length > 0) {
    const { data: prods, error: pErr } = await admin
      .from("products")
      .select("id, price, is_available, category_id, option_mode, option_price_delta")
      .in("id", productIds);
    if (pErr || !prods) {
      console.error(LOG_PREFIX, "products read failed", pErr?.message);
      return fail(500, "Erreur serveur.");
    }
    for (const p of prods) {
      productsById[p.id] = p as ProductRow;
      categoryIds.add(p.category_id);
    }
    if (prods.length !== productIds.length) {
      return fail(400, "Produit inconnu ou autre boutique.");
    }
  }

  const catsById: Record<string, CategoryRow> = {};
  if (categoryIds.size > 0) {
    const { data: cats, error: cErr } = await admin
      .from("categories")
      .select("id, shop_id")
      .in("id", [...categoryIds]);
    if (cErr || !cats) {
      console.error(LOG_PREFIX, "categories read failed", cErr?.message);
      return fail(500, "Erreur serveur.");
    }
    for (const c of cats) {
      catsById[c.id] = c as CategoryRow;
    }
  }

  type ResolvedLine = {
    product_id: string | null;
    bundle_id: string | null;
    quantity: number;
    unit_price: number;
    option_value: string | null;
    special_note: string | null;
  };

  const resolvedLines: ResolvedLine[] = [];
  let sumCents = 0;

  for (const item of body.items) {
    if (item.isBundle) {
      const bid = item.bundleId as string;
      const b = bundlesById[bid];
      if (!b || b.shop_id !== shopId) {
        return fail(400, "Formule inconnue ou autre boutique.");
      }
      if (!(b.is_active ?? false)) {
        return fail(409, "Une formule n'est plus disponible.");
      }
      const unit = Number(b.price);
      if (!Number.isFinite(unit) || unit < 0) {
        console.error(LOG_PREFIX, "invalid bundle price", { bundleId: bid });
        return fail(500, "Erreur serveur.");
      }
      if (unit > STRIPE_MAX_UNIT_PRICE_EUR) {
        return fail(400, "Le prix unitaire dépasse la limite autorisée.");
      }
      if (item.unitPrice !== undefined) {
        if (Math.abs(toCents(item.unitPrice) - toCents(unit)) > 1) {
          return fail(
            400,
            "Le prix affiché ne correspond plus au catalogue. Rafraîchissez la page."
          );
        }
      }
      sumCents += toCents(unit) * item.quantity;
      resolvedLines.push({
        product_id: null,
        bundle_id: bid,
        quantity: item.quantity,
        unit_price: unit,
        option_value: item.optionValue ?? null,
        special_note: item.specialNote ?? null,
      });
      continue;
    }

    const p = productsById[item.productId];
    if (!p) {
      return fail(400, "Produit inconnu ou autre boutique.");
    }
    const cat = catsById[p.category_id];
    if (!cat || cat.shop_id !== shopId) {
      return fail(400, "Produit inconnu ou autre boutique.");
    }
    if (!(p.is_available ?? false)) {
      return fail(409, "Un produit n'est plus disponible.");
    }
    const unit = Number(p.price);
    if (!Number.isFinite(unit) || unit < 0) {
      console.error(LOG_PREFIX, "invalid product price", { productId: item.productId });
      return fail(500, "Erreur serveur.");
    }
    const optionMode = p.option_mode === "free" || p.option_mode === "paid" ? p.option_mode : "none";
    const hasSelectedOption = Boolean(item.optionValue && item.optionValue.trim().length > 0);
    if (optionMode !== "none" && !hasSelectedOption) {
      return fail(400, "Une option obligatoire n'a pas été renseignée.");
    }
    if (optionMode === "none" && hasSelectedOption) {
      return fail(400, "Option invalide pour ce produit.");
    }
    const optionSurcharge =
      optionMode === "paid" && hasSelectedOption
        ? Math.max(0, Number(p.option_price_delta ?? 0))
        : 0;
    const expectedUnit = unit + optionSurcharge;
    if (!Number.isFinite(expectedUnit) || expectedUnit < 0) {
      console.error(LOG_PREFIX, "invalid product price with option surcharge", {
        productId: item.productId,
        unit,
        optionSurcharge,
      });
      return fail(500, "Erreur serveur.");
    }
    if (expectedUnit > STRIPE_MAX_UNIT_PRICE_EUR) {
      return fail(400, "Le prix unitaire dépasse la limite autorisée.");
    }
    if (item.unitPrice !== undefined) {
      if (Math.abs(toCents(item.unitPrice) - toCents(expectedUnit)) > 1) {
        return fail(
          400,
          "Le prix affiché ne correspond plus au catalogue. Rafraîchissez la page."
        );
      }
    }
    sumCents += toCents(expectedUnit) * item.quantity;
    resolvedLines.push({
      product_id: item.productId,
      bundle_id: null,
      quantity: item.quantity,
      unit_price: expectedUnit,
      option_value: item.optionValue ?? null,
      special_note: item.specialNote ?? null,
    });
  }

  const totalAmount = sumCents / 100;
  if (!totalsMatchCents(totalAmount, sumCents)) {
    console.error(LOG_PREFIX, "total rounding mismatch", { sumCents, totalAmount });
    return fail(500, "Erreur serveur.");
  }

  const { data: insertedOrder, error: orderErr } = await admin
    .from("orders")
    .insert({
      shop_id: shopId,
      customer_name: body.customer_name.trim(),
      customer_phone: body.customer_phone?.trim() || null,
      fulfillment_mode: body.fulfillment_mode,
      table_number: body.table_number?.trim() || null,
      delivery_address: body.delivery_address?.trim() || null,
      notes: body.notes?.trim() || null,
      status: "pending",
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (orderErr || !insertedOrder) {
    console.error(LOG_PREFIX, "order insert failed", orderErr?.message);
    return fail(500, "Erreur lors de la création de la commande.");
  }

  const orderId = insertedOrder.id;

  const orderItemsInsert = resolvedLines.map((row) => ({
    order_id: orderId,
    product_id: row.product_id,
    bundle_id: row.bundle_id,
    quantity: row.quantity,
    unit_price: row.unit_price,
    option_value: row.option_value,
    special_note: row.special_note,
  }));

  const { error: itemsErr } = await admin.from("order_items").insert(orderItemsInsert);

  if (itemsErr) {
    console.error(LOG_PREFIX, "order_items insert failed, rolling back", {
      orderId,
      message: itemsErr.message,
    });
    const { error: delErr } = await admin.from("orders").delete().eq("id", orderId);
    if (delErr) {
      console.error(LOG_PREFIX, "rollback delete failed", { orderId, message: delErr.message });
    }
    return fail(500, "Erreur lors de l'enregistrement des articles.");
  }

  return { ok: true, orderId };
}
