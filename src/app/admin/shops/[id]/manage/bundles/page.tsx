import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";
import {
  adminSaveBundle,
  adminDeleteBundle,
  adminSetShopBundlesMenuGrouped,
} from "@/app/admin/manage-actions";
import { BundlesClient } from "@/components/product/BundlesClient";
import { buttonVariants } from "@/components/ui/button";
import type {
  BundleFormProductOption,
  BundleSavePayload,
  BundleRow,
  BundleSlotData,
} from "@/components/product/BundleForm";

type Params = Promise<{ id: string }>;

export default async function AdminManageBundlesPage({ params }: { params: Params }) {
  const { id: shopId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await resolveIsAdmin(supabase, user))) redirect("/dashboard");

  const service = createServiceClient();

  const { data: menuFlagRow } = await service
    .from("shops")
    .select("bundles_menu_grouped")
    .eq("id", shopId)
    .maybeSingle();

  const initialBundlesMenuGrouped =
    typeof menuFlagRow?.bundles_menu_grouped === "boolean"
      ? menuFlagRow.bundles_menu_grouped
      : false;

  const { data: categories } = await service
    .from("categories")
    .select("id, name, name_fr, icon_emoji")
    .eq("shop_id", shopId)
    .order("display_order");

  const categoriesForClient = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    icon_emoji: c.icon_emoji ?? "",
  }));

  const categoryIds = (categories ?? []).map((c) => c.id);
  const { data: rawProducts } = await service
    .from("products")
    .select("id, category_id, name, name_fr, name_en, price, is_available, display_order")
    .in("category_id", categoryIds)
    .order("display_order");

  const productsForBundlesForm: BundleFormProductOption[] = (rawProducts ?? []).map((p) => ({
    id: p.id,
    category_id: p.category_id,
    name: p.name,
    name_fr: p.name_fr ?? null,
    name_en: p.name_en ?? null,
    price: Number(p.price),
    is_available: p.is_available ?? true,
    display_order: p.display_order ?? 0,
  }));

  if (!categories?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Créez d&apos;abord des catégories avant de composer des formules.</p>
        <Link href={`/admin/shops/${shopId}/manage/categories`} className={buttonVariants({ variant: "outline" })}>
          Gérer les catégories
        </Link>
      </div>
    );
  }

  const { data: bundles } = await service
    .from("bundles")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  const bundleIds = (bundles ?? []).map((b) => b.id);
  let slotsMap: Record<string, BundleSlotData[]> = {};
  if (bundleIds.length > 0) {
    const { data: slots } = await service
      .from("bundle_slots")
      .select("*")
      .in("bundle_id", bundleIds)
      .order("display_order");
    slotsMap = (slots ?? []).reduce<Record<string, BundleSlotData[]>>((acc, s) => {
      if (!acc[s.bundle_id]) acc[s.bundle_id] = [];
      acc[s.bundle_id].push({
        id: s.id,
        category_id: s.category_id,
        label: s.label,
        label_fr: (s as { label_fr?: string | null }).label_fr ?? s.label,
        label_en: (s as { label_en?: string | null }).label_en ?? null,
        quantity: s.quantity ?? 1,
        display_order: s.display_order ?? 0,
        excluded_product_ids: s.excluded_product_ids ?? [],
      });
      return acc;
    }, {});
  }

  const initialBundles: BundleRow[] = (bundles ?? []).map((b) => {
    const br = b as typeof b & {
      name_fr?: string | null;
      name_en?: string | null;
      description_fr?: string | null;
      description_en?: string | null;
    };
    return {
      id: b.id,
      shop_id: b.shop_id,
      name: b.name,
      name_fr: br.name_fr ?? b.name,
      name_en: br.name_en ?? null,
      description: b.description,
      description_fr: br.description_fr ?? b.description,
      description_en: br.description_en ?? null,
      price: Number(b.price),
      image_url: b.image_url,
      is_active: b.is_active ?? false,
      created_at: b.created_at ?? null,
      slots: slotsMap[b.id] ?? [],
    };
  });

  async function onSave(payload: BundleSavePayload, isEdit: boolean, existingId?: string): Promise<BundleRow> {
    "use server";
    return adminSaveBundle(shopId, payload, isEdit, existingId);
  }

  async function onDelete(id: string): Promise<void> {
    "use server";
    return adminDeleteBundle(shopId, id);
  }

  async function onBundlesMenuGroupedChange(value: boolean): Promise<void> {
    "use server";
    await adminSetShopBundlesMenuGrouped(shopId, value);
  }

  return (
    <BundlesClient
      shopId={shopId}
      categories={categoriesForClient}
      productsForBundlesForm={productsForBundlesForm}
      initialBundles={initialBundles}
      initialBundlesMenuGrouped={initialBundlesMenuGrouped}
      onBundlesMenuGroupedChange={onBundlesMenuGroupedChange}
      adminActions={{ onSave, onDelete }}
    />
  );
}
