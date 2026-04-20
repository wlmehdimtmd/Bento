import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchShopStorefrontEditorPayload } from "@/lib/fetchShopStorefrontEditorPayload";
import { StorefrontBentoEditor } from "@/components/dashboard/StorefrontBentoEditor";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Mise en page vitrine" };

  const { data } = await supabase
    .from("shops")
    .select("name")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return { title: data ? `Mise en page — ${data.name}` : "Mise en page vitrine" };
}

export default async function ShopVitrineMiseEnPagePage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!owned) notFound();

  const payload = await fetchShopStorefrontEditorPayload(supabase, shopId);
  if (!payload) notFound();

  return (
    <div className="p-6 md:p-8">
      <StorefrontBentoEditor
        shopId={payload.shopId}
        slug={payload.shop.slug}
        shop={payload.shop}
        categories={payload.categories}
        bundles={payload.bundles}
        bundlesMenuGrouped={payload.bundlesMenuGrouped}
        reviews={payload.reviews}
        storefrontPhotos={payload.storefrontPhotos}
        initialLayout={payload.storefrontBentoLayout}
      />
    </div>
  );
}
