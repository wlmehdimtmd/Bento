import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";
import { adminSaveCategory, adminDeleteCategory } from "@/app/admin/manage-actions";
import { CategoriesClient } from "@/components/product/CategoriesClient";
import type { CategorySavePayload, CategoryRow } from "@/components/product/CategoryForm";

type Params = Promise<{ id: string }>;

export default async function AdminManageCategoriesPage({ params }: { params: Params }) {
  const { id: shopId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await resolveIsAdmin(supabase, user))) redirect("/dashboard");

  const service = createServiceClient();

  const { data: categories } = await service
    .from("categories")
    .select("*")
    .eq("shop_id", shopId)
    .order("display_order");

  const catIds = (categories ?? []).map((c) => c.id);
  let productCountMap: Record<string, number> = {};
  if (catIds.length > 0) {
    const { data: products } = await service
      .from("products")
      .select("category_id")
      .in("category_id", catIds);
    productCountMap = (products ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.category_id] = (acc[p.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const initialCategories = (categories ?? []).map((c) => ({
    id: c.id,
    shop_id: c.shop_id,
    name: c.name,
    description: c.description,
    icon_emoji: c.icon_emoji,
    cover_image_url: c.cover_image_url,
    is_active: c.is_active,
    display_order: c.display_order,
    created_at: c.created_at,
    productCount: productCountMap[c.id] ?? 0,
  }));

  async function onSave(payload: CategorySavePayload, isEdit: boolean, existingId?: string): Promise<CategoryRow> {
    "use server";
    return adminSaveCategory(shopId, payload, isEdit, existingId);
  }

  async function onDelete(id: string): Promise<void> {
    "use server";
    return adminDeleteCategory(shopId, id);
  }

  return (
    <CategoriesClient
      shopId={shopId}
      initialCategories={initialCategories}
      adminActions={{ onSave, onDelete }}
    />
  );
}
