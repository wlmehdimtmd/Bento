import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchPlaceDetails(placeId: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,formatted_address,rating,user_ratings_total,url");
  url.searchParams.set("language", "fr");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("Google Places Details API error");

  const data = await res.json();
  if (data.status !== "OK") throw new Error(`Google Places error: ${data.status}`);

  const r = data.result;
  return {
    name: r.name as string,
    address: r.formatted_address as string,
    rating: r.rating as number | undefined,
    review_count: r.user_ratings_total as number | undefined,
    url: r.url as string | undefined,
  };
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId, placeId } = await req.json() as { shopId: string; placeId: string };
  if (!shopId || !placeId) {
    return NextResponse.json({ error: "shopId and placeId required" }, { status: 400 });
  }

  // Verify shop ownership
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
  }

  let details;
  try {
    details = await fetchPlaceDetails(placeId);
  } catch {
    return NextResponse.json({ error: "Could not fetch place details from Google" }, { status: 502 });
  }

  const admin = getAdmin();
  const { error } = await admin.from("shop_reviews").upsert({
    shop_id: shopId,
    google_enabled: true,
    google_place_id: placeId,
    google_place_name: details.name,
    google_place_address: details.address,
    google_rating: details.rating ?? null,
    google_review_count: details.review_count ?? null,
    google_url: details.url ?? null,
    google_last_fetched: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "shop_id" });

  if (error) {
    console.error("[google-connect] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    name: details.name,
    address: details.address,
    rating: details.rating ?? null,
    review_count: details.review_count ?? null,
    url: details.url ?? null,
  });
}
