import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getStripe } from "@/lib/stripe/server";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("[webhook] No orderId in session metadata");
        break;
      }

      if (session.payment_status !== "paid") {
        console.error("[webhook] Session not paid, skipping confirm", { orderId, payment_status: session.payment_status });
        break;
      }

      const admin = getSupabaseAdmin();
      const { data: orderRow, error: orderFetchErr } = await admin
        .from("orders")
        .select("id, total_amount, status")
        .eq("id", orderId)
        .single();

      if (orderFetchErr || !orderRow) {
        console.error("[webhook] Order not found:", orderId, orderFetchErr?.message);
        return NextResponse.json({ error: "Order not found" }, { status: 500 });
      }

      if (orderRow.status !== "pending") {
        console.warn("[webhook] Order not pending, idempotent skip", { orderId, status: orderRow.status });
        break;
      }

      const expectedCents = Math.round(Number(orderRow.total_amount) * 100);
      const paidCents = session.amount_total;
      if (paidCents == null || Math.abs(paidCents - expectedCents) > 1) {
        console.error("[webhook] amount_total mismatch — order not confirmed", {
          orderId,
          expectedCents,
          paidCents,
        });
        break;
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const { error } = await admin
        .from("orders")
        .update({
          status: "confirmed",
          stripe_payment_intent_id: paymentIntentId,
          stripe_payment_status: "paid",
        })
        .eq("id", orderId)
        .eq("status", "pending");

      if (error) {
        console.error("[webhook] Failed to update order:", error.message);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      console.log(`[webhook] Order ${orderId} confirmed.`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await getSupabaseAdmin()
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderId)
          .eq("status", "pending"); // only cancel if still pending
      }
      break;
    }

    default:
      // Unhandled event — return 200 to acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
