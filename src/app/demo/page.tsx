import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveDemoSourceShopId } from "@/lib/platformDemo";
import { fetchPublicShopPagePayload } from "@/lib/fetchPublicShopPagePayload";
import { DemoView } from "./DemoView";
import { DemoLiveStoreView } from "@/components/demo/DemoLiveStoreView";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

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

  return <DemoView />;
}
