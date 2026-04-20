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

  const { shopId, provider, enabled } = await req.json() as {
    shopId: string;
    provider: "google" | "tripadvisor";
    enabled: boolean;
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

  const field = provider === "google" ? "google_enabled" : "tripadvisor_enabled";

  const admin = getAdmin();
  const { error } = await admin.from("shop_reviews").upsert(
    { shop_id: shopId, [field]: enabled, updated_at: new Date().toISOString() },
    { onConflict: "shop_id" }
  );

  if (error) {
    console.error("[reviews/toggle] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
