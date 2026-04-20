import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { ShopForm } from "@/components/shop/ShopForm";
import { buttonVariants } from "@/components/ui/button";
import type { ShopReviews, SocialLinks } from "@/lib/types";
import { storefrontPublicUrl } from "@/lib/publicAppUrl";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Admin — Configuration vitrine" };

export default async function AdminShopSettingsPage({ params }: { params: Params }) {
  const { id: shopId } = await params;
  const service = await assertAdminOrRedirect();

  const { data: shop } = await service.from("shops").select("*").eq("id", shopId).maybeSingle();

  if (!shop) notFound();

  const { data: shopReviews } = await service
    .from("shop_reviews")
    .select("*")
    .eq("shop_id", shopId)
    .maybeSingle();

  const storeUrl = storefrontPublicUrl(shop.slug);

  const socialLinks: SocialLinks =
    typeof shop.social_links === "object" && shop.social_links !== null
      ? (shop.social_links as SocialLinks)
      : {};

  const fulfillmentModes = Array.isArray(shop.fulfillment_modes)
    ? (shop.fulfillment_modes as string[])
    : [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
            Configuration vitrine — {shop.name}
          </h1>
        </div>

        <ShopForm
          key={shop.id}
          userId={shop.owner_id as string}
          submitAsAdmin
          adminRedirectPath={`/admin/shops/${shopId}/settings`}
          vitrineTabbed
          shopId={shopId}
          storeUrl={storeUrl}
          initialReviews={(shopReviews ?? null) as ShopReviews | null}
          reviewsMutateApiBase="/api/admin/reviews"
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
            social_links: socialLinks,
            fulfillment_modes: fulfillmentModes,
            opening_hours: shop.opening_hours,
            opening_timezone: shop.opening_timezone,
            open_on_public_holidays: shop.open_on_public_holidays,
          }}
        />
      </div>
    </div>
  );
}
