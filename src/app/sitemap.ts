import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { publicAppUrl } from "@/lib/publicAppUrl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicAppUrl;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/?lang=fr`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/?lang=en`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/demo?lang=fr`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/demo?lang=en`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cgv`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  // Dynamic shop routes
  try {
    const supabase = await createClient();
    const { data: shops } = await supabase
      .from("shops")
      .select("slug")
      .eq("is_active", true);

    const shopRoutes: MetadataRoute.Sitemap = (shops ?? []).map((shop) => ({
      url: `${baseUrl}/${shop.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const localizedShopRoutes: MetadataRoute.Sitemap = (shops ?? []).flatMap((shop) => [
      {
        url: `${baseUrl}/${shop.slug}?lang=fr`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/${shop.slug}?lang=en`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ]);

    return [...staticRoutes, ...shopRoutes, ...localizedShopRoutes];
  } catch {
    return staticRoutes;
  }
}
