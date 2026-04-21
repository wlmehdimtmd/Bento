import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ShopReviews } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { resolveDemoSourceShopId } from "@/lib/platformDemo";
import { fetchPublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import { DemoView } from "./DemoView";
import { DemoLiveStoreView } from "@/components/demo/DemoLiveStoreView";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

const DEMO_PLACE_ID = "ChIJEZfXAcVx5kcRHQGcF21SLyw";
const DEMO_GOOGLE_URL = "https://maps.google.com/?cid=3183854090075242781";

async function fetchDemoReviews(): Promise<ShopReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", DEMO_PLACE_ID);
    url.searchParams.set("fields", "rating,user_ratings_total");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK") return null;

    const r = data.result;
    return {
      shop_id: "demo",
      google_enabled: true,
      google_place_id: DEMO_PLACE_ID,
      google_place_name: "Kanpai Paris",
      google_place_address: "19 Rue Bréa, 75006 Paris, France",
      google_rating: r.rating ?? null,
      google_review_count: r.user_ratings_total ?? null,
      google_url: DEMO_GOOGLE_URL,
      google_last_fetched: new Date().toISOString(),
      tripadvisor_enabled: false,
      tripadvisor_url: null,
      tripadvisor_name: null,
      tripadvisor_rating: null,
      tripadvisor_review_count: null,
      tripadvisor_last_fetched: null,
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const supabase = await createClient();
  const demoShopId = await resolveDemoSourceShopId(supabase);

  if (!demoShopId) {
    return {
      title: "Démo — Maison Kanpai | Bento Resto",
      description:
        locale === "en"
          ? "Discover an interactive Bento Resto demo with Maison Kanpai."
          : "Découvrez une démo interactive de Bento Resto avec le restaurant franco-japonais Maison Kanpai.",
    };
  }

  const payload = await fetchPublicShopPagePayload(supabase, { id: demoShopId }, locale);
  if (!payload) {
    return {
      title: locale === "en" ? "Demo | Bento Resto" : "Démo | Bento Resto",
      description: locale === "en" ? "Discover an interactive Bento Resto demo." : "Découvrez une démo interactive de Bento Resto.",
    };
  }

  const { shop } = payload;
  const imageUrl = shop.cover_image_url ?? shop.logo_url;
  const description =
    shop.description ??
    (locale === "en"
      ? `Discover ${shop.name}'s menu in demo mode on Bento Resto.`
      : `Découvrez la carte de ${shop.name} en mode démo sur Bento Resto.`);

  return {
    title: `${locale === "en" ? "Demo" : "Démo"} — ${shop.name} | Bento Resto`,
    description,
    alternates: {
      canonical: "/demo",
      languages: {
        fr: "/demo?lang=fr",
        en: "/demo?lang=en",
      },
    },
    openGraph: {
      title: `${locale === "en" ? "Demo" : "Démo"} — ${shop.name}`,
      description,
      type: "website",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: shop.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${locale === "en" ? "Demo" : "Démo"} — ${shop.name}`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function DemoPage() {
  const supabase = await createClient();
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const demoShopId = await resolveDemoSourceShopId(supabase);

  if (demoShopId) {
    const payload = await fetchPublicShopPagePayload(supabase, { id: demoShopId }, locale);
    if (payload) {
      return (
        <DemoLiveStoreView
          shop={payload.shop}
          categories={payload.categories}
          bundles={payload.bundles}
          bundlesMenuGrouped={payload.bundlesMenuGrouped}
          reviews={payload.reviews}
          storefrontPhotos={payload.storefrontPhotos}
          savedStorefrontLayout={payload.savedStorefrontLayout}
          storefrontThemeKey={payload.storefrontThemeKey}
          storefrontThemeOverrides={payload.storefrontThemeOverrides}
          shopLabels={payload.shopLabels}
          stripeAccountId={payload.stripeAccountId}
        />
      );
    }
  }

  const reviews = await fetchDemoReviews();
  return <DemoView reviews={reviews} />;
}
