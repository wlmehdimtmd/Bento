import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderList } from "@/components/order/OrderList";
import type { OrderRow } from "@/components/order/OrderCard";

export const metadata = { title: "Commandes" };

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!shop) redirect("/dashboard");

  const { data: rawOrders } = await supabase
    .from("orders")
    .select(
      "id, shop_id, order_number, customer_name, customer_email, customer_phone, fulfillment_mode, table_number, delivery_address, status, total_amount, stripe_payment_intent_id, stripe_payment_status, notes, created_at"
    )
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const initialOrders: OrderRow[] = (rawOrders ?? []).map((o) => ({
    id: o.id,
    shop_id: o.shop_id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    customer_email: o.customer_email,
    customer_phone: o.customer_phone,
    fulfillment_mode: o.fulfillment_mode,
    table_number: o.table_number,
    delivery_address: o.delivery_address,
    status: o.status,
    total_amount: Number(o.total_amount),
    stripe_payment_intent_id: o.stripe_payment_intent_id,
    stripe_payment_status: o.stripe_payment_status,
    notes: o.notes,
    created_at: o.created_at,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Commandes
        </h1>
        <p className="text-sm text-muted-foreground">{shop.name}</p>
      </div>

      <OrderList initialOrders={initialOrders} shopId={shop.id} />
    </div>
  );
}
