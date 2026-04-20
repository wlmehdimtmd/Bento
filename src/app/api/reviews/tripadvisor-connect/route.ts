import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface JsonLdRating {
  "@type"?: string;
  ratingValue?: string | number;
  reviewCount?: string | number;
  bestRating?: string | number;
}

interface JsonLdRestaurant {
  "@type"?: string | string[];
  name?: string;
  aggregateRating?: JsonLdRating;
}

async function scrapeTripAdvisor(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  // Extract all JSON-LD blocks
  const jsonLdMatches = html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of jsonLdMatches) {
    let parsed: JsonLdRestaurant;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }

    const types = Array.isArray(parsed["@type"]) ? parsed["@type"] : [parsed["@type"]];
    const isRestaurant = types.some(
      (t) => t && ["Restaurant", "FoodEstablishment", "LocalBusiness"].includes(t)
    );

    if (isRestaurant && parsed.aggregateRating) {
      const ar = parsed.aggregateRating;
      return {
        name: parsed.name ?? null,
        rating: ar.ratingValue ? parseFloat(String(ar.ratingValue)) : null,
        review_count: ar.reviewCount ? parseInt(String(ar.reviewCount), 10) : null,
      };
    }
  }

  throw new Error("No aggregateRating found in JSON-LD");
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId, url } = await req.json() as { shopId: string; url: string };
  if (!shopId || !url) {
    return NextResponse.json({ error: "shopId and url required" }, { status: 400 });
  }

  if (!url.includes("tripadvisor.")) {
    return NextResponse.json({ error: "Invalid TripAdvisor URL" }, { status: 400 });
  }

  // Verify shop ownership
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let scraped;
  try {
    scraped = await scrapeTripAdvisor(url);
  } catch (err) {
    console.error("[tripadvisor-connect] Scrape error:", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données TripAdvisor. Vérifiez l'URL." },
      { status: 502 }
    );
  }

  const admin = getAdmin();
  const { error } = await admin.from("shop_reviews").upsert({
    shop_id: shopId,
    tripadvisor_enabled: true,
    tripadvisor_url: url,
    tripadvisor_name: scraped.name,
    tripadvisor_rating: scraped.rating,
    tripadvisor_review_count: scraped.review_count,
    tripadvisor_last_fetched: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "shop_id" });

  if (error) {
    console.error("[tripadvisor-connect] DB error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    name: scraped.name,
    rating: scraped.rating,
    review_count: scraped.review_count,
    url,
  });
}
