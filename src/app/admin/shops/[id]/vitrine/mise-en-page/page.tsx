import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { fetchShopStorefrontEditorPayload } from "@/lib/fetchShopStorefrontEditorPayload";
import { StorefrontBentoEditor } from "@/components/dashboard/StorefrontBentoEditor";
import { buttonVariants } from "@/components/ui/button";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Admin — Mise en page vitrine" };

export default async function AdminShopVitrineMiseEnPagePage({ params }: { params: Params }) {
  const { id: shopId } = await params;
  const service = await assertAdminOrRedirect();

  const payload = await fetchShopStorefrontEditorPayload(service, shopId);
  if (!payload) notFound();

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Admin
        </Link>
        <StorefrontBentoEditor
          shopId={payload.shopId}
          slug={payload.shop.slug}
          shop={payload.shop}
          categories={payload.categories}
          bundles={payload.bundles}
          bundlesMenuGrouped={payload.bundlesMenuGrouped}
          reviews={payload.reviews}
          initialLayout={payload.storefrontBentoLayout}
          initialStorefrontThemeKey={payload.storefrontThemeKey}
          initialStorefrontThemeOverrides={payload.storefrontThemeOverrides}
          backHref="/admin"
          layoutSaveMode="admin"
        />
      </div>
    </div>
  );
}
