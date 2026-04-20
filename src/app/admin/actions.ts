"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildDemoTemplateShopInsert, DEMO_TEMPLATE_SHOP_SLUG } from "@/lib/demoTemplateShop";
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

export async function createShopAdmin(data: {
  owner_email: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email_contact?: string;
}) {
  const service = await requireAdmin();

  const { data: users, error: userErr } = await service
    .from("users")
    .select("id")
    .eq("email", data.owner_email)
    .limit(1);
  if (userErr || !users?.length) throw new Error("Utilisateur introuvable pour cet email");
  const ownerId = users[0].id;

  const { error } = await service.from("shops").insert({
    owner_id: ownerId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    address: data.address ?? null,
    phone: data.phone ?? null,
    email_contact: data.email_contact ?? null,
    type: "restaurant",
    fulfillment_modes: ["dine_in"] as unknown as Json,
    is_active: false,
    social_links: {} as Json,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function ensureDemoTemplateShop() {
  const service = await requireAdmin();

  const { data: existing } = await service
    .from("shops")
    .select("id")
    .eq("slug", DEMO_TEMPLATE_SHOP_SLUG)
    .maybeSingle();

  if (existing?.id) {
    revalidatePath("/");
    revalidatePath("/demo");
    revalidatePath("/admin");
    revalidatePath("/admin/demo/settings");
    redirect(`/admin/shops/${existing.id}/settings`);
  }

  const { data: owners, error: ownerErr } = await service
    .from("users")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (ownerErr || !owners?.length) {
    throw new Error(
      "Aucun utilisateur en base : créez un compte (inscription) avant de créer la boutique modèle."
    );
  }

  const ownerId = owners[0].id;
  const row = buildDemoTemplateShopInsert(ownerId);

  const { data: inserted, error } = await service.from("shops").insert(row).select("id").single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Le slug réservé est déjà utilisé. Supprimez ou renommez la boutique en conflit.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/demo");
  revalidatePath("/admin");
  revalidatePath("/admin/demo/settings");
  redirect(`/admin/shops/${inserted.id}/settings`);
}

export async function setDemoShopId(shopId: string | null) {
  const service = await requireAdmin();

  let resolvedShopId = shopId;
  if (resolvedShopId) {
    const { data: tpl } = await service
      .from("shops")
      .select("id")
      .eq("slug", DEMO_TEMPLATE_SHOP_SLUG)
      .maybeSingle();
    const tplId = (tpl as { id: string } | null)?.id;
    if (tplId && resolvedShopId === tplId) {
      resolvedShopId = null;
    }
  }

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
