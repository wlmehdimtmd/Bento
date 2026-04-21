import Stripe from "stripe";

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  return _stripe ?? (_stripe = new Stripe(process.env.STRIPE_SECRET_KEY!));
}

export interface StripeLineItem {
  name: string;
  quantity: number;
  unitPrice: number; // in euros (not cents)
}

/**
 * Creates a Stripe Checkout session for an order.
 *
 * @param orderId        UUID of the Supabase order (metadata + client_reference_id)
 * @param shopSlug       Shop slug for success/cancel redirect URLs
 * @param items          Cart items to display as Stripe line_items
 * @param successOrigin  Base URL of the app (e.g. https://bento.app)
 * @param _stripeAccountId  Connected account ID — reserved for Stripe Connect (unused in MVP)
 */
export async function createCheckoutSession(
  orderId: string,
  shopSlug: string,
  items: StripeLineItem[],
  successOrigin: string,
  _stripeAccountId?: string | null
) {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: { name: item.name },
      },
    })),
    metadata: { orderId },
    client_reference_id: orderId,
    success_url: `${successOrigin}/${shopSlug}?order=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${successOrigin}/${shopSlug}?order=cancelled`,
  });

  return session;
}
