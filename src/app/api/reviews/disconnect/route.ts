import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId, provider } = await req.json() as {
    shopId: string;
    provider: "google" | "tripadvisor";
  };

  if (!shopId || !provider) {
    return NextResponse.json({ error: "shopId and provider required" }, { status: 400 });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getAdmin();

  const patch =
    provider === "google"
      ? {
          shop_id: shopId,
          google_enabled: false,
          google_place_id: null,
          google_place_name: null,
          google_place_address: null,
          google_rating: null,
          google_review_count: null,
          google_url: null,
          google_last_fetched: null,
          updated_at: new Date().toISOString(),
        }
      : {
          shop_id: shopId,
          tripadvisor_enabled: false,
          tripadvisor_url: null,
          tripadvisor_name: null,
          tripadvisor_rating: null,
          tripadvisor_review_count: null,
          tripadvisor_last_fetched: null,
          updated_at: new Date().toISOString(),
        };

  const { error } = await admin.from("shop_reviews").upsert(patch, { onConflict: "shop_id" });

  if (error) {
    console.error("[reviews/disconnect] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
