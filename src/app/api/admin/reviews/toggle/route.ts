import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/admin/requireAdmin";

export async function POST(req: Request) {
  try {
    const service = await requireAdmin();

    const { shopId, enabled } = (await req.json()) as {
      shopId: string;
      enabled: boolean;
    };

    if (!shopId || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "shopId and enabled required" }, { status: 400 });
    }

    const { data: shop } = await service.from("shops").select("id").eq("id", shopId).maybeSingle();
    if (!shop) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const field = "tripadvisor_enabled";

    const { error } = await service.from("shop_reviews").upsert(
      { shop_id: shopId, [field]: enabled, updated_at: new Date().toISOString() },
      { onConflict: "shop_id" }
    );

    if (error) {
      console.error("[admin/reviews/toggle] DB error:", error.message);
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
