import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StripeLineItem } from "@/lib/stripe/server";

function toCents(euros: number): number {
  return Math.round(Number(euros) * 100);
}

function totalsMatchCents(orderTotalEuros: number, sumLineCents: number): boolean {
  return Math.abs(toCents(orderTotalEuros) - sumLineCents) <= 1;
}

/**
 * Reconstruit les lignes Stripe à partir des `order_items` et des prix catalogue (produits / bundles).
 * Vérifie que la boutique est active et que le total commande correspond à la somme serveur.
 */
export async function buildStripeLineItemsFromOrder(
  admin: SupabaseClient<Database>,
  order: { id: string; shop_id: string; total_amount: number }
): Promise<
  { ok: true; items: StripeLineItem[]; totalCents: number } | { ok: false; status: number; message: string }
> {
  const { data: shop, error: shopErr } = await admin
    .from("shops")
    .select("id, is_active")
    .eq("id", order.shop_id)
    .single();

  if (shopErr || !shop?.is_active) {
    return { ok: false, status: 404, message: "Boutique introuvable ou inactive." };
  }

  const { data: rows, error: itemsErr } = await admin
    .from("order_items")
    .select("id, product_id, bundle_id, quantity, unit_price")
    .eq("order_id", order.id);

  if (itemsErr) {
    console.error("[checkoutLineItems] order_items:", itemsErr.message);
    return { ok: false, status: 500, message: "Erreur lecture des articles." };
  }

  if (!rows?.length) {
    return { ok: false, status: 400, message: "Commande sans article." };
  }

  const productIds = rows.map((r) => r.product_id).filter((id): id is string => id != null);
  const bundleIds = rows.map((r) => r.bundle_id).filter((id): id is string => id != null);

  type ProductRow = {
    id: string;
    name: string;
    price: number;
    is_available: boolean;
    category_id: string;
  };
  let productsById: Record<string, ProductRow> = {};
  const categoryIds = new Set<string>();

  if (productIds.length > 0) {
    const { data: prods, error: pErr } = await admin
      .from("products")
      .select("id, name, price, is_available, category_id")
      .in("id", productIds);
    if (pErr || !prods) {
      console.error("[checkoutLineItems] products:", pErr?.message);
      return { ok: false, status: 500, message: "Erreur lecture des produits." };
    }
    for (const p of prods) {
      productsById[p.id] = p as ProductRow;
      categoryIds.add(p.category_id);
    }
  }

  type CatRow = { id: string; shop_id: string };
  let catsById: Record<string, CatRow> = {};
  if (categoryIds.size > 0) {
    const { data: cats, error: cErr } = await admin
      .from("categories")
      .select("id, shop_id")
      .in("id", [...categoryIds]);
    if (cErr || !cats) {
      console.error("[checkoutLineItems] categories:", cErr?.message);
      return { ok: false, status: 500, message: "Erreur lecture des catégories." };
    }
    for (const c of cats) {
      catsById[c.id] = c as CatRow;
    }
  }

  type BundleRow = { id: string; name: string; price: number; is_active: boolean; shop_id: string };
  let bundlesById: Record<string, BundleRow> = {};
  if (bundleIds.length > 0) {
    const { data: bundles, error: bErr } = await admin
      .from("bundles")
      .select("id, name, price, is_active, shop_id")
      .in("id", bundleIds);
    if (bErr || !bundles) {
      console.error("[checkoutLineItems] bundles:", bErr?.message);
      return { ok: false, status: 500, message: "Erreur lecture des formules." };
    }
    for (const b of bundles) {
      bundlesById[b.id] = b as BundleRow;
    }
  }

  const stripeItems: StripeLineItem[] = [];
  let sumCents = 0;

  for (const row of rows) {
    const qty = row.quantity;
    if (qty < 1) {
      return { ok: false, status: 400, message: "Quantité invalide." };
    }

    if (row.product_id) {
      const p = productsById[row.product_id];
      if (!p) {
        return { ok: false, status: 400, message: "Produit inconnu sur cette commande." };
      }
      const cat = catsById[p.category_id];
      if (!cat || cat.shop_id !== order.shop_id) {
        return { ok: false, status: 400, message: "Produit ne correspond pas à la boutique." };
      }
      if (!p.is_available) {
        return { ok: false, status: 409, message: "Un produit n'est plus disponible." };
      }
      const unit = Number(p.price);
      if (!Number.isFinite(unit) || unit < 0) {
        return { ok: false, status: 500, message: "Prix produit invalide." };
      }
      const lineCents = toCents(unit) * qty;
      sumCents += lineCents;
      stripeItems.push({ name: p.name, quantity: qty, unitPrice: unit });
      continue;
    }

    if (row.bundle_id) {
      const b = bundlesById[row.bundle_id];
      if (!b) {
        return { ok: false, status: 400, message: "Formule inconnue sur cette commande." };
      }
      if (b.shop_id !== order.shop_id) {
        return { ok: false, status: 400, message: "Formule ne correspond pas à la boutique." };
      }
      if (!b.is_active) {
        return { ok: false, status: 409, message: "Une formule n'est plus disponible." };
      }
      const unit = Number(b.price);
      if (!Number.isFinite(unit) || unit < 0) {
        return { ok: false, status: 500, message: "Prix formule invalide." };
      }
      const lineCents = toCents(unit) * qty;
      sumCents += lineCents;
      stripeItems.push({ name: b.name, quantity: qty, unitPrice: unit });
      continue;
    }

    return { ok: false, status: 400, message: "Ligne de commande sans produit ni formule." };
  }

  if (!totalsMatchCents(order.total_amount, sumCents)) {
    console.warn("[checkoutLineItems] total mismatch", {
      orderId: order.id,
      orderTotal: order.total_amount,
      sumCents,
    });
    return {
      ok: false,
      status: 400,
      message: "Le total de la commande ne correspond pas au catalogue. Rafraîchissez et réessayez.",
    };
  }

  return { ok: true, items: stripeItems, totalCents: sumCents };
}
