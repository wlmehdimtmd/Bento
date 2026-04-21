import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin/requireAdmin";

export async function POST(req: Request) {
  try {
    const service = await requireAdmin();

    const { shopId } = (await req.json()) as { shopId: string };

    if (!shopId) {
      return NextResponse.json({ error: "shopId required" }, { status: 400 });
    }

    const { data: shop } = await service.from("shops").select("id").eq("id", shopId).maybeSingle();
    if (!shop) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const patch = {
      shop_id: shopId,
      tripadvisor_enabled: false,
      tripadvisor_url: null,
      tripadvisor_name: null,
      tripadvisor_rating: null,
      tripadvisor_review_count: null,
      tripadvisor_last_fetched: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await service.from("shop_reviews").upsert(patch, { onConflict: "shop_id" });

    if (error) {
      console.error("[admin/reviews/disconnect] DB error:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
