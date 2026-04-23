import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";
import { adminSaveProduct, adminDeleteProduct } from "@/app/admin/manage-actions";
import { ProductsClient } from "@/components/product/ProductsClient";
import { fetchShopLabelsForDashboard } from "@/lib/shop-labels";
import { buttonVariants } from "@/components/ui/button";
import type { ProductSavePayload, ProductRow } from "@/components/product/ProductForm";

type Params = Promise<{ id: string }>;

export default async function AdminManageProductsPage({ params }: { params: Params }) {
  const { id: shopId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await resolveIsAdmin(supabase, user))) redirect("/dashboard");

  const service = createServiceClient();

  const { data: categories } = await service
    .from("categories")
    .select("id, name, icon_emoji")
    .eq("shop_id", shopId)
    .order("display_order");

  const cats = categories ?? [];
  const categoriesForClient = cats.map((c) => ({
    id: c.id,
    name: c.name,
    icon_emoji: c.icon_emoji ?? "",
  }));

  if (cats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Créez d&apos;abord des catégories avant d&apos;ajouter des produits.</p>
        <Link href={`/admin/shops/${shopId}/manage/categories`} className={buttonVariants({ variant: "outline" })}>
          Gérer les catégories
        </Link>
      </div>
    );
  }

  const catIds = cats.map((c) => c.id);
  const { data: products } = await service
    .from("products")
    .select("*")
    .in("category_id", catIds)
    .order("display_order");

  const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));
  const initialProducts = (products ?? []).map((p) => ({
    id: p.id,
    category_id: p.category_id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image_url: p.image_url,
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    option_label: p.option_label,
    option_label_fr: p.option_label_fr,
    option_label_en: p.option_label_en,
    option_mode: p.option_mode === "free" || p.option_mode === "paid" ? p.option_mode : "none",
    option_price_delta: Number(p.option_price_delta ?? 0),
    option_choices: Array.isArray(p.option_choices) ? (p.option_choices as string[]) : [],
    is_available: p.is_available ?? true,
    display_order: p.display_order ?? 0,
    created_at: p.created_at ?? null,
    categoryName: catMap[p.category_id]?.name ?? "—",
  }));

  async function onSave(payload: ProductSavePayload, isEdit: boolean, existingId?: string): Promise<ProductRow> {
    "use server";
    return adminSaveProduct(shopId, payload, isEdit, existingId);
  }

  async function onDelete(id: string): Promise<void> {
    "use server";
    return adminDeleteProduct(shopId, id);
  }

  const labelRows = await fetchShopLabelsForDashboard(service, shopId);
  const shopLabels = labelRows.map(({ value, label, color }) => ({ value, label, color }));

  return (
    <ProductsClient
      shopId={shopId}
      categories={categoriesForClient}
      initialProducts={initialProducts}
      shopLabels={shopLabels}
      adminActions={{ onSave, onDelete }}
    />
  );
}
