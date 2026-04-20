import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });

    const shopId = shop.id;
    const service = createServiceClient();

    // Delete child data in dependency order
    const { data: bundles } = await service.from("bundles").select("id").eq("shop_id", shopId);
    if (bundles?.length) {
      await service.from("bundle_slots").delete().in("bundle_id", bundles.map((b) => b.id));
    }
    await service.from("bundles").delete().eq("shop_id", shopId);

    const { data: orders } = await service.from("orders").select("id").eq("shop_id", shopId);
    if (orders?.length) {
      await service.from("order_items").delete().in("order_id", orders.map((o) => o.id));
    }
    await service.from("orders").delete().eq("shop_id", shopId);

    const { data: categories } = await service.from("categories").select("id").eq("shop_id", shopId);
    if (categories?.length) {
      await service.from("products").delete().in("category_id", categories.map((c) => c.id));
    }
    await service.from("categories").delete().eq("shop_id", shopId);

    // Reset shop fields, clear onboarding flag
    const { error } = await service
      .from("shops")
      .update({
        description: null,
        address: null,
        phone: null,
        email_contact: null,
        logo_url: null,
        cover_image_url: null,
        social_links: {},
        fulfillment_modes: [],
        opening_hours: null,
        opening_timezone: "Europe/Paris",
        open_on_public_holidays: false,
      })
      .eq("id", shopId);

    if (error) {
      console.error("[shop/reset] Échec reset boutique", { shopId, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shopId });
  } catch (err) {
    console.error("[shop/reset] Erreur inattendue", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
