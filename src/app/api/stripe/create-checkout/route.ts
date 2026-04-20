import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { buildStripeLineItemsFromOrder } from "@/lib/stripe/checkoutLineItemsFromOrder";
import { createCheckoutSession } from "@/lib/stripe/server";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    const admin = getSupabaseAdmin();

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

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
