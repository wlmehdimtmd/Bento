import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── TripAdvisor scrape ────────────────────────────────────────────────────────

interface JsonLdRating {
  ratingValue?: string | number;
  reviewCount?: string | number;
}
interface JsonLdDoc {
  "@type"?: string | string[];
  name?: string;
  aggregateRating?: JsonLdRating;
}

async function refreshTripAdvisor(url: string) {
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
  const jsonLdMatches = html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of jsonLdMatches) {
    let parsed: JsonLdDoc;
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
        tripadvisor_name: parsed.name ?? null,
        tripadvisor_rating: ar.ratingValue ? parseFloat(String(ar.ratingValue)) : null,
        tripadvisor_review_count: ar.reviewCount ? parseInt(String(ar.reviewCount), 10) : null,
        tripadvisor_last_fetched: new Date().toISOString(),
      };
    }
  }

  throw new Error("No aggregateRating in JSON-LD");
}

// ── CRON handler ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET requis en production." }, { status: 401 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn("[cron/refresh-reviews] CRON_SECRET absent — autorisé en non-production uniquement");
  }

  const admin = getAdmin();

  const { data: rows, error } = await admin
    .from("shop_reviews")
    .select("shop_id, tripadvisor_enabled, tripadvisor_url, tripadvisor_last_fetched");

  if (error) {
    console.error("[cron/refresh-reviews] Fetch error:", error.message);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  const now = new Date();
  const results = { tripadvisor: { ok: 0, fail: 0 } };

  for (const row of rows ?? []) {
    if (row.tripadvisor_enabled && row.tripadvisor_url) {
      const lastFetched = row.tripadvisor_last_fetched
        ? new Date(row.tripadvisor_last_fetched)
        : null;
      const shouldRefresh =
        !lastFetched || now.getTime() - lastFetched.getTime() > 7 * 24 * 60 * 60 * 1000;

      if (shouldRefresh) {
        try {
          const patch = await refreshTripAdvisor(row.tripadvisor_url);
          await admin
            .from("shop_reviews")
            .update({ ...patch, updated_at: now.toISOString() })
            .eq("shop_id", row.shop_id);
          results.tripadvisor.ok++;
        } catch (err) {
          console.error(`[cron] TripAdvisor refresh failed for shop ${row.shop_id}:`, err);
          results.tripadvisor.fail++;
        }
      }
    }
  }

  console.log("[cron/refresh-reviews] Done:", results);
  return NextResponse.json({ ok: true, results });
}
