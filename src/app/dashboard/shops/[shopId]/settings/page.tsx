import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopForm } from "@/components/shop/ShopForm";
import type { ShopReviews, SocialLinks } from "@/lib/types";
import { storefrontPublicUrl } from "@/lib/publicAppUrl";

type Params = Promise<{ shopId: string }>;

export const metadata = { title: "Configuration vitrine" };

export default async function ShopSettingsPage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) notFound();

  const { data: shopReviews } = await supabase
    .from("shop_reviews")
    .select("*")
    .eq("shop_id", shopId)
    .single();

  const storeUrl = storefrontPublicUrl(shop.slug);

  const socialLinks: SocialLinks =
    typeof shop.social_links === "object" && shop.social_links !== null
      ? (shop.social_links as SocialLinks)
      : {};

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  return (
    <div className="max-w-3xl space-y-8 p-6 md:p-8">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-onest)" }}
      >
        Configuration vitrine — {shop.name}
      </h1>

      <ShopForm
        key={shop.id}
        userId={user.id}
        vitrineTabbed
        shopId={shopId}
        storeUrl={storeUrl}
        initialReviews={(shopReviews ?? null) as ShopReviews | null}
        initialData={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          type: shop.type,
          description: shop.description,
          address: shop.address,
          phone: shop.phone,
          email_contact: shop.email_contact,
          logo_url: shop.logo_url,
          cover_image_url: shop.cover_image_url,
          owner_photo_url: shop.owner_photo_url,
          social_links: socialLinks,
          fulfillment_modes: fulfillmentModes,
          opening_hours: shop.opening_hours,
          opening_timezone: shop.opening_timezone,
          open_on_public_holidays: shop.open_on_public_holidays,
        }}
      />
    </div>
  );
}
