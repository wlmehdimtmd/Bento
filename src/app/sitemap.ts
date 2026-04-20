import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bentorest.app";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
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

    return [...staticRoutes, ...shopRoutes];
  } catch {
    return staticRoutes;
  }
}
