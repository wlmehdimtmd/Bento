"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth-utils";
import type { CategoryRow } from "@/components/product/CategoryForm";
import type { ProductRow } from "@/components/product/ProductForm";
import type { BundleRow } from "@/components/product/BundleForm";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) throw new Error("Unauthorized");
  return createServiceClient();
}

function managePath(shopId: string) {
  return `/admin/shops/${shopId}/manage`;
}

// ─── Categories ───────────────────────────────────────────────

export async function adminSaveCategory(
  shopId: string,
  payload: {
    name: string;
    description: string | null;
    icon_emoji: string;
    cover_image_url: string | null;
    is_active: boolean;
    display_order: number;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<CategoryRow> {
  const service = await requireAdmin();

  if (isEdit && existingId) {
    const { data, error } = await service
      .from("categories")
      .update({
        name: payload.name,
        description: payload.description,
        icon_emoji: payload.icon_emoji || "📦",
        cover_image_url: payload.cover_image_url,
        is_active: payload.is_active,
      })
      .eq("id", existingId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    revalidatePath(managePath(shopId));
    return data as CategoryRow;
  }

  const { count } = await service
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId);
  const { data, error } = await service
    .from("categories")
    .insert({
      shop_id: shopId,
      name: payload.name,
      description: payload.description,
      icon_emoji: payload.icon_emoji || "📦",
      cover_image_url: payload.cover_image_url,
      is_active: payload.is_active,
      display_order: payload.display_order ?? (count ?? 0) + 1,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(managePath(shopId));
  return data as CategoryRow;
}

export async function adminDeleteCategory(shopId: string, categoryId: string) {
  const service = await requireAdmin();
  const { error } = await service.from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(error.message);
  revalidatePath(managePath(shopId));
}

// ─── Products ─────────────────────────────────────────────────

export async function adminSaveProduct(
  shopId: string,
  payload: {
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    tags: string[];
    option_label: string | null;
    is_available: boolean;
    display_order: number;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<ProductRow> {
  const service = await requireAdmin();

  if (isEdit && existingId) {
    const { data, error } = await service
      .from("products")
      .update({
        category_id: payload.category_id,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        image_url: payload.image_url,
        tags: payload.tags,
        option_label: payload.option_label,
        is_available: payload.is_available,
      })
      .eq("id", existingId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    revalidatePath(managePath(shopId));
    return { ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow;
  }

  const { count } = await service
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", payload.category_id);
  const { data, error } = await service
    .from("products")
    .insert({
      category_id: payload.category_id,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      image_url: payload.image_url,
      tags: payload.tags,
      option_label: payload.option_label,
      is_available: payload.is_available,
      display_order: payload.display_order ?? (count ?? 0) + 1,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(managePath(shopId));
  return { ...data, tags: Array.isArray(data.tags) ? (data.tags as string[]) : [] } as ProductRow;
}

export async function adminDeleteProduct(shopId: string, productId: string) {
  const service = await requireAdmin();
  const { error } = await service.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath(managePath(shopId));
}

// ─── Bundles ──────────────────────────────────────────────────

export async function adminSaveBundle(
  shopId: string,
  payload: {
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    slots: Array<{ id?: string; category_id: string; label: string; quantity: number; display_order: number }>;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<BundleRow> {
  const service = await requireAdmin();

  let bundleId: string;

  if (isEdit && existingId) {
    const { error } = await service
      .from("bundles")
      .update({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        image_url: payload.image_url,
        is_active: payload.is_active,
      })
      .eq("id", existingId);
    if (error) throw new Error(error.message);
    bundleId = existingId;

    const { error: delError } = await service
      .from("bundle_slots")
      .delete()
      .eq("bundle_id", bundleId);
    if (delError) throw new Error(delError.message);
  } else {
    const { data, error } = await service
      .from("bundles")
      .insert({
        shop_id: shopId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        image_url: payload.image_url,
        is_active: payload.is_active,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    bundleId = data.id;
  }

  const slotsPayload = payload.slots.map((s, i) => ({
    bundle_id: bundleId,
    category_id: s.category_id,
    label: s.label,
    quantity: s.quantity,
    display_order: i,
  }));
  const { data: savedSlots, error: slotsError } = await service
    .from("bundle_slots")
    .insert(slotsPayload)
    .select();
  if (slotsError) throw new Error(slotsError.message);

  const { data: fullBundle, error: bundleError } = await service
    .from("bundles")
    .select("*")
    .eq("id", bundleId)
    .single();
  if (bundleError) throw new Error(bundleError.message);

  revalidatePath(managePath(shopId));
  return {
    ...(fullBundle as Omit<BundleRow, "slots">),
    price: Number(fullBundle.price),
    slots: (savedSlots ?? []).map((s) => ({
      id: s.id,
      category_id: s.category_id,
      label: s.label,
      quantity: s.quantity,
      display_order: s.display_order,
    })),
  };
}

export async function adminDeleteBundle(shopId: string, bundleId: string) {
  const service = await requireAdmin();
  const { error } = await service.from("bundles").delete().eq("id", bundleId);
  if (error) throw new Error(error.message);
  revalidatePath(managePath(shopId));
}

export async function adminSetShopBundlesMenuGrouped(shopId: string, value: boolean) {
  const service = await requireAdmin();
  const { error } = await service
    .from("shops")
    .update({ bundles_menu_grouped: value })
    .eq("id", shopId);
  if (error) throw new Error(error.message);
  const { data: row } = await service.from("shops").select("slug").eq("id", shopId).maybeSingle();
  if (row?.slug) revalidatePath(`/${row.slug}`);
  revalidatePath(managePath(shopId));
}
