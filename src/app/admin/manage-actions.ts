"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";
import type { CategoryRow } from "@/components/product/CategoryForm";
import type { ProductRow } from "@/components/product/ProductForm";
import type { BundleRow } from "@/components/product/BundleForm";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await resolveIsAdmin(supabase, user))) throw new Error("Unauthorized");
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
    name_fr: string;
    name_en: string | null;
    description: string | null;
    description_fr: string | null;
    description_en: string | null;
    icon_emoji: string;
    is_active: boolean;
    display_order: number;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<CategoryRow> {
  const service = await requireAdmin();

  const row = {
    name: payload.name,
    name_fr: payload.name_fr,
    name_en: payload.name_en,
    description: payload.description,
    description_fr: payload.description_fr,
    description_en: payload.description_en,
    icon_emoji: payload.icon_emoji || "📦",
    is_active: payload.is_active,
  };

  if (isEdit && existingId) {
    const { data, error } = await service
      .from("categories")
      .update(row)
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
      ...row,
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
  const { error: slotsError } = await service
    .from("bundle_slots")
    .delete()
    .eq("category_id", categoryId);
  if (slotsError) throw new Error(slotsError.message);

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
    name_fr: string;
    name_en: string | null;
    description: string | null;
    description_fr: string | null;
    description_en: string | null;
    price: number;
    image_url: string | null;
    tags: string[];
    option_label: string | null;
    option_label_fr: string | null;
    option_label_en: string | null;
    option_mode: "none" | "free" | "paid";
    option_price_delta: number;
    option_choices: string[];
    is_available: boolean;
    display_order: number;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<ProductRow> {
  const service = await requireAdmin();

  const row = {
    category_id: payload.category_id,
    name: payload.name,
    name_fr: payload.name_fr,
    name_en: payload.name_en,
    description: payload.description,
    description_fr: payload.description_fr,
    description_en: payload.description_en,
    price: payload.price,
    image_url: payload.image_url,
    tags: payload.tags,
    option_label: payload.option_label,
    option_label_fr: payload.option_label_fr,
    option_label_en: payload.option_label_en,
    option_mode: payload.option_mode,
    option_price_delta: payload.option_price_delta,
    option_choices: payload.option_choices,
    is_available: payload.is_available,
  };

  if (isEdit && existingId) {
    const { data, error } = await service
      .from("products")
      .update(row)
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
      ...row,
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
    name_fr: string;
    name_en: string | null;
    description: string | null;
    description_fr: string | null;
    description_en: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    slots: Array<{
      id?: string;
      category_id: string;
      label: string;
      label_fr: string;
      label_en: string | null;
      quantity: number;
      display_order: number;
      excluded_product_ids: string[];
    }>;
  },
  isEdit: boolean,
  existingId?: string,
): Promise<BundleRow> {
  const service = await requireAdmin();

  let bundleId: string;

  const bundleRow = {
    name: payload.name,
    name_fr: payload.name_fr,
    name_en: payload.name_en,
    description: payload.description,
    description_fr: payload.description_fr,
    description_en: payload.description_en,
    price: payload.price,
    image_url: payload.image_url,
    is_active: payload.is_active,
  };

  if (isEdit && existingId) {
    const { error } = await service
      .from("bundles")
      .update(bundleRow)
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
        ...bundleRow,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    bundleId = data.id;
  }

  const slotsPayload = payload.slots.map((s, i) => ({
    bundle_id: bundleId,
    category_id: s.category_id,
    label: s.label_fr,
    label_fr: s.label_fr,
    label_en: s.label_en,
    quantity: s.quantity,
    display_order: i,
    excluded_product_ids: s.excluded_product_ids,
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
      label_fr: (s as { label_fr?: string | null }).label_fr ?? s.label,
      label_en: (s as { label_en?: string | null }).label_en ?? null,
      quantity: s.quantity ?? 1,
      display_order: s.display_order ?? 0,
      excluded_product_ids: Array.isArray(
        (s as { excluded_product_ids?: string[] | null }).excluded_product_ids
      )
        ? ((s as { excluded_product_ids: string[] }).excluded_product_ids ?? [])
        : [],
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
