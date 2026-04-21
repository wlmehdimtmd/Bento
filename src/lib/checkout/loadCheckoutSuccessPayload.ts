import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { pickLocalized, type AppLocale } from "@/lib/i18n";
import { getStripe } from "@/lib/stripe/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type OrderConfirmationLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CheckoutSuccessOrder = {
  id: string;
  order_number: number;
  total_amount: number;
  fulfillment_mode: string;
  customer_name: string;
  table_number: string | null;
  delivery_address: string | null;
  status: string;
};

export type CheckoutSuccessSyncState = "ready" | "pending_webhook";

export type CheckoutSuccessPayload =
  | { ok: false }
  | {
      ok: true;
      order: CheckoutSuccessOrder;
      lineItems: OrderConfirmationLine[];
      syncState: CheckoutSuccessSyncState;
    };

type ProductNameRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "name" | "name_fr" | "name_en"
>;
type BundleNameRow = Pick<
  Database["public"]["Tables"]["bundles"]["Row"],
  "name" | "name_fr" | "name_en"
>;

function displayNameForCatalogRow(
  locale: AppLocale,
  row: ProductNameRow | BundleNameRow | null
): string | null {
  if (!row) return null;
  return pickLocalized(locale, {
    fr: row.name_fr,
    en: row.name_en,
    legacy: row.name,
  });
}

type OrderItemRow = {
  id: string;
  quantity: number;
  unit_price: number;
  option_value: string | null;
  special_note: string | null;
  product: ProductNameRow | null;
  bundle: BundleNameRow | null;
};

export async function loadCheckoutSuccessPayload(input: {
  slug: string;
  sessionId: string;
  locale: AppLocale;
  supabaseAnon: SupabaseClient<Database>;
}): Promise<CheckoutSuccessPayload> {
  const { slug, sessionId, locale, supabaseAnon } = input;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error("[checkout-success] Stripe sessions.retrieve failed", { sessionId, e });
    return { ok: false };
  }

  if (session.id !== sessionId) {
    console.error("[checkout-success] session id mismatch", { sessionId, stripeId: session.id });
    return { ok: false };
  }

  if (!session.client_reference_id?.trim()) {
    console.error("[checkout-success] missing client_reference_id", { sessionId: session.id });
    return { ok: false };
  }

  if (session.payment_status !== "paid") {
    return { ok: false };
  }

  const { data: shopRow, error: shopErr } = await supabaseAnon
    .from("shops")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (shopErr || !shopRow) {
    return { ok: false };
  }

  const admin = createServiceRoleClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(
      "id, shop_id, order_number, status, total_amount, fulfillment_mode, customer_name, table_number, delivery_address, stripe_checkout_session_id"
    )
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (orderErr) {
    console.error("[checkout-success] order select failed", orderErr.message);
    return { ok: false };
  }

  if (!order) {
    return { ok: false };
  }

  if (order.id !== session.client_reference_id) {
    console.error("[checkout-success] client_reference_id does not match order.id", {
      orderId: order.id,
      client_reference_id: session.client_reference_id,
    });
    return { ok: false };
  }

  if (order.shop_id !== shopRow.id) {
    console.error("[checkout-success] order shop_id does not match slug shop", {
      slug,
      orderShopId: order.shop_id,
      slugShopId: shopRow.id,
    });
    return { ok: false };
  }

  if (order.status === "cancelled") {
    return { ok: false };
  }

  const syncState: CheckoutSuccessSyncState =
    order.status === "pending" ? "pending_webhook" : "ready";

  const { data: itemRows, error: itemsErr } = await admin
    .from("order_items")
    .select(
      `id, quantity, unit_price, option_value, special_note,
       product:products (name, name_fr, name_en),
       bundle:bundles (name, name_fr, name_en)`
    )
    .eq("order_id", order.id);

  if (itemsErr) {
    console.error("[checkout-success] order_items select failed", itemsErr.message);
    return { ok: false };
  }

  const lineItems: OrderConfirmationLine[] = (itemRows ?? []).map((raw) => {
    const row = raw as unknown as OrderItemRow;
    const productRow = Array.isArray(row.product) ? row.product[0] : row.product;
    const bundleRow = Array.isArray(row.bundle) ? row.bundle[0] : row.bundle;
    const base =
      displayNameForCatalogRow(locale, productRow) ??
      displayNameForCatalogRow(locale, bundleRow) ??
      (locale === "en" ? "Item" : "Article");
    const opt = row.option_value ? ` (${row.option_value})` : "";
    const note = row.special_note ? ` — ${row.special_note}` : "";
    return {
      id: row.id,
      name: `${base}${opt}${note}`,
      quantity: row.quantity,
      unitPrice: Number(row.unit_price),
    };
  });

  const { shop_id: _shop, stripe_checkout_session_id: _sid, ...orderRest } = order;

  return {
    ok: true,
    order: {
      ...orderRest,
      status: orderRest.status ?? "pending",
      total_amount: Number(order.total_amount),
    },
    lineItems,
    syncState,
  };
}
