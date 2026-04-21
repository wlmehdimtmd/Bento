import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { buildStripeLineItemsFromOrder } from "@/lib/stripe/checkoutLineItemsFromOrder";
import { createCheckoutSession } from "@/lib/stripe/server";

interface RequestBody {
  orderId: string;
  /** @deprecated ignoré — les montants sont recalculés côté serveur depuis la commande */
  items?: unknown;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const admin = createServiceRoleClient();

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, shop_id, total_amount, status")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order already processed" }, { status: 409 });
    }

    const resolved = await buildStripeLineItemsFromOrder(admin, {
      id: order.id,
      shop_id: order.shop_id,
      total_amount: Number(order.total_amount),
    });

    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: resolved.status });
    }

    const { data: shop, error: shopErr } = await admin
      .from("shops")
      .select("slug, stripe_account_id")
      .eq("id", order.shop_id)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const origin = new URL(req.url).origin;

    const session = await createCheckoutSession(
      orderId,
      shop.slug,
      resolved.items,
      origin,
      shop.stripe_account_id
    );

    const { data: linkedRows, error: linkErr } = await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("id");

    if (linkErr) {
      console.error("[create-checkout] Failed to persist stripe_checkout_session_id:", linkErr.message);
      return NextResponse.json({ error: "Failed to link checkout session" }, { status: 500 });
    }

    if (!linkedRows?.length) {
      console.error("[create-checkout] No pending order updated for session id", {
        orderId,
        sessionId: session.id,
      });
      return NextResponse.json({ error: "Order state conflict" }, { status: 409 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
