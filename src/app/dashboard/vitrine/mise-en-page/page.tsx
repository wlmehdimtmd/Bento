import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchShopStorefrontEditorPayload } from "@/lib/fetchShopStorefrontEditorPayload";
import { StorefrontBentoEditor } from "@/components/dashboard/StorefrontBentoEditor";

export const metadata = { title: "Mise en page vitrine" };

export default async function VitrineMiseEnPagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!shop) redirect("/dashboard");

  const payload = await fetchShopStorefrontEditorPayload(supabase, shop.id);
  if (!payload) redirect("/dashboard");

  return (
    <div className="p-6 md:p-8">
      <StorefrontBentoEditor
        shopId={payload.shopId}
        slug={payload.shop.slug}
        shop={payload.shop}
        categories={payload.categories}
        bundles={payload.bundles}
        bundlesMenuGrouped={payload.bundlesMenuGrouped}
        storefrontPhotos={payload.storefrontPhotos}
        initialLayout={payload.storefrontBentoLayout}
        initialStorefrontThemeKey={payload.storefrontThemeKey}
        initialStorefrontThemeOverrides={payload.storefrontThemeOverrides}
      />
    </div>
  );
}
