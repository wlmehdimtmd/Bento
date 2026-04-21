"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import type { Json } from "@/lib/supabase/database.types";

export async function deleteShop(shopId: string) {
  const service = await requireAdmin();
  const { error } = await service.from("shops").delete().eq("id", shopId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function toggleShopActive(shopId: string, current: boolean) {
  const service = await requireAdmin();
  const { error } = await service
    .from("shops")
    .update({ is_active: !current })
    .eq("id", shopId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateShopAdmin(
  shopId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    address?: string;
    phone?: string;
    email_contact?: string;
    is_active: boolean;
  }
) {
  const service = await requireAdmin();
  const { error } = await service.from("shops").update(data).eq("id", shopId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setDemoShopId(shopId: string | null) {
  const service = await requireAdmin();

  const resolvedShopId = shopId;

  if (resolvedShopId) {
    const { data } = await service
      .from("shops")
      .select("id, is_active")
      .eq("id", resolvedShopId)
      .maybeSingle();
    if (!data?.id || !data.is_active) {
      throw new Error(
        "Boutique introuvable ou inactive. Seules les boutiques actives peuvent être exposées sur /demo."
      );
    }
  }

  const { error } = await service.from("platform_settings").upsert(
    {
      id: "default",
      demo_shop_id: resolvedShopId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      throw new Error(
        "Table « platform_settings » absente ou cache schéma. Exécutez scripts/apply-platform-settings.sql dans Supabase."
      );
    }
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/demo");
  revalidatePath("/admin");
  revalidatePath("/admin/demo/settings");
  redirect("/admin/demo/settings");
}

export async function saveStorefrontBentoLayoutAdmin(
  shopId: string,
  shopSlug: string,
  payload: Json,
  storefrontThemeKey: string,
  storefrontThemeOverrides?: Json
) {
  const service = await requireAdmin();
  const { data: shop } = await service.from("shops").select("id").eq("id", shopId).maybeSingle();
  if (!shop) throw new Error("Boutique introuvable");

  const { error } = await service
    .from("shops")
    .update({
      storefront_bento_layout: payload,
      storefront_theme_key: storefrontThemeKey,
      storefront_theme_overrides: storefrontThemeOverrides ?? null,
    })
    .eq("id", shopId);

  if (error) throw new Error(error.message);

  revalidatePath("/demo");
  revalidatePath(`/admin/shops/${shopId}/vitrine/mise-en-page`);
  revalidatePath(`/${shopSlug}`);
}

export async function updateShopProfileAdmin(
  shopId: string,
  data: {
    name: string;
    slug: string;
    type: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email_contact: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    social_links: Json;
    fulfillment_modes: Json;
    opening_hours: Json | null;
    opening_timezone: string;
    open_on_public_holidays: boolean;
  }
) {
  const service = await requireAdmin();
  const { data: shop } = await service.from("shops").select("id").eq("id", shopId).maybeSingle();
  if (!shop) throw new Error("Boutique introuvable");

  const { error } = await service.from("shops").update(data).eq("id", shopId);
  if (error) {
    if (error.code === "23505") throw new Error("SLUG_DUPLICATE");
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/demo");
  revalidatePath(`/admin/shops/${shopId}/settings`);
}
