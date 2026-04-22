import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

import { LOCAL_MULTI_STOREFRONT_BLUEPRINTS } from "./data/localMultiStorefrontBlueprints.mjs";

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf-8");
    const env = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const shouldReset = process.argv.includes("--reset");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function toSlug(source) {
  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureAuthUser(owner) {
  const pageSize = 200;
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }
    const existing = data.users.find((user) => user.email?.toLowerCase() === owner.email.toLowerCase());
    if (existing) {
      return existing.id;
    }
    if (data.users.length < pageSize) break;
    page += 1;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: owner.email,
    password: owner.password,
    email_confirm: true,
    user_metadata: { full_name: owner.full_name },
  });
  if (createError || !created.user) {
    throw new Error(`Unable to create auth user ${owner.email}: ${createError?.message ?? "unknown"}`);
  }
  return created.user.id;
}

async function upsertPublicUser(userId, owner) {
  const payload = {
    id: userId,
    email: owner.email,
    full_name: owner.full_name,
  };
  const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(`Unable to upsert public.users for ${owner.email}: ${error.message}`);
  }
}

async function ensureShop(userId, blueprint) {
  const { data: existing, error: selectError } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Unable to fetch shop for ${blueprint.owner.email}: ${selectError.message}`);
  }

  const shopPayload = {
    owner_id: userId,
    name: blueprint.shop_name_fr,
    name_fr: blueprint.shop_name_fr,
    name_en: blueprint.shop_name_en,
    slug: blueprint.slug ?? `${toSlug(blueprint.shop_name_fr)}-local`,
    type: blueprint.shop_type,
    description: blueprint.shop_description_fr,
    description_fr: blueprint.shop_description_fr,
    description_en: blueprint.shop_description_en,
    email_contact: blueprint.owner.email,
    phone: "+33 1 00 00 00 00",
    address: "Local test dataset, France",
    fulfillment_modes: blueprint.fulfillment_modes,
    is_active: true,
    bundles_menu_grouped: blueprint.bundles_menu_grouped,
    storefront_theme_key: blueprint.storefront_theme_key,
    storefront_theme_overrides: null,
    social_links: {
      website: `https://${blueprint.slug}.local`,
      instagram: `https://instagram.com/${blueprint.slug.replace(/-/g, "")}`,
    },
  };

  if (!existing?.id) {
    const { data: inserted, error: insertError } = await supabase
      .from("shops")
      .insert(shopPayload)
      .select("id")
      .single();
    if (insertError || !inserted?.id) {
      throw new Error(`Unable to insert shop ${blueprint.shop_name_fr}: ${insertError?.message ?? "unknown"}`);
    }
    return inserted.id;
  }

  const { error: updateError } = await supabase.from("shops").update(shopPayload).eq("id", existing.id);
  if (updateError) {
    throw new Error(`Unable to update shop ${blueprint.shop_name_fr}: ${updateError.message}`);
  }
  return existing.id;
}

async function clearShopCatalog(shopId, resetOrders) {
  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("shop_id", shopId);
  if (categoryError) {
    throw new Error(`Unable to list categories for cleanup: ${categoryError.message}`);
  }
  const categoryIds = (categoryRows ?? []).map((row) => row.id);

  const { data: bundleRows, error: bundleError } = await supabase
    .from("bundles")
    .select("id")
    .eq("shop_id", shopId);
  if (bundleError) {
    throw new Error(`Unable to list bundles for cleanup: ${bundleError.message}`);
  }
  const bundleIds = (bundleRows ?? []).map((row) => row.id);

  if (bundleIds.length > 0) {
    const { error: slotsDeleteError } = await supabase.from("bundle_slots").delete().in("bundle_id", bundleIds);
    if (slotsDeleteError) {
      throw new Error(`Unable to delete bundle slots: ${slotsDeleteError.message}`);
    }
  }

  const { error: bundlesDeleteError } = await supabase.from("bundles").delete().eq("shop_id", shopId);
  if (bundlesDeleteError) {
    throw new Error(`Unable to delete bundles: ${bundlesDeleteError.message}`);
  }

  if (categoryIds.length > 0) {
    const { error: productsDeleteError } = await supabase.from("products").delete().in("category_id", categoryIds);
    if (productsDeleteError) {
      throw new Error(`Unable to delete products: ${productsDeleteError.message}`);
    }
  }

  const { error: categoriesDeleteError } = await supabase.from("categories").delete().eq("shop_id", shopId);
  if (categoriesDeleteError) {
    throw new Error(`Unable to delete categories: ${categoriesDeleteError.message}`);
  }

  const { error: labelsDeleteError } = await supabase.from("shop_labels").delete().eq("shop_id", shopId);
  if (labelsDeleteError) {
    throw new Error(`Unable to delete shop labels: ${labelsDeleteError.message}`);
  }

  if (resetOrders) {
    const { error: itemsDeleteError } = await supabase.from("order_items").delete().eq("shop_id", shopId);
    if (itemsDeleteError) {
      throw new Error(`Unable to delete order items: ${itemsDeleteError.message}`);
    }
    const { error: ordersDeleteError } = await supabase.from("orders").delete().eq("shop_id", shopId);
    if (ordersDeleteError) {
      throw new Error(`Unable to delete orders: ${ordersDeleteError.message}`);
    }
  }
}

async function insertLabels(shopId, labels) {
  const payload = labels.map((label, index) => ({
    shop_id: shopId,
    value: label.value,
    label: label.label_fr,
    label_fr: label.label_fr,
    label_en: label.label_en,
    color: label.color,
    display_order: index + 1,
  }));
  const { error } = await supabase.from("shop_labels").insert(payload);
  if (error) {
    throw new Error(`Unable to insert labels: ${error.message}`);
  }
}

async function insertCatalog(shopId, blueprint) {
  const categoryIdByKey = new Map();

  for (const category of blueprint.categories) {
    const categoryPayload = {
      shop_id: shopId,
      name: category.name_fr,
      name_fr: category.name_fr,
      name_en: category.name_en,
      description: category.description_fr,
      description_fr: category.description_fr,
      description_en: category.description_en,
      icon_emoji: category.icon_emoji,
      display_order: category.display_order,
      is_active: category.is_active,
    };

    const { data: categoryRow, error: categoryError } = await supabase
      .from("categories")
      .insert(categoryPayload)
      .select("id")
      .single();
    if (categoryError || !categoryRow?.id) {
      throw new Error(`Unable to insert category ${category.name_fr}: ${categoryError?.message ?? "unknown"}`);
    }
    categoryIdByKey.set(category.key, categoryRow.id);

    const productPayload = category.products.map((product) => ({
      category_id: categoryRow.id,
      name: product.name_fr,
      name_fr: product.name_fr,
      name_en: product.name_en,
      description: product.description_fr,
      description_fr: product.description_fr,
      description_en: product.description_en,
      option_label: product.option_label_fr,
      option_label_fr: product.option_label_fr,
      option_label_en: product.option_label_en,
      price: product.price,
      is_available: product.is_available,
      display_order: product.display_order,
      tags: product.tags,
    }));
    const { error: productError } = await supabase.from("products").insert(productPayload);
    if (productError) {
      throw new Error(`Unable to insert products for category ${category.name_fr}: ${productError.message}`);
    }
  }

  for (const bundle of blueprint.bundles) {
    const bundlePayload = {
      shop_id: shopId,
      name: bundle.name_fr,
      name_fr: bundle.name_fr,
      name_en: bundle.name_en,
      description: bundle.description_fr,
      description_fr: bundle.description_fr,
      description_en: bundle.description_en,
      price: bundle.price,
      is_active: bundle.is_active,
    };

    const { data: bundleRow, error: bundleError } = await supabase
      .from("bundles")
      .insert(bundlePayload)
      .select("id")
      .single();
    if (bundleError || !bundleRow?.id) {
      throw new Error(`Unable to insert bundle ${bundle.name_fr}: ${bundleError?.message ?? "unknown"}`);
    }

    const slotsPayload = bundle.slots.map((slot) => {
      const categoryId = categoryIdByKey.get(slot.category_key);
      if (!categoryId) {
        throw new Error(`Unknown category key "${slot.category_key}" in bundle "${bundle.key}"`);
      }
      return {
        bundle_id: bundleRow.id,
        category_id: categoryId,
        label: slot.label_fr,
        label_fr: slot.label_fr,
        label_en: slot.label_en,
        quantity: slot.quantity,
        display_order: slot.display_order,
      };
    });

    const { error: slotError } = await supabase.from("bundle_slots").insert(slotsPayload);
    if (slotError) {
      throw new Error(`Unable to insert bundle slots for ${bundle.name_fr}: ${slotError.message}`);
    }
  }
}

async function seedOneShop(blueprint) {
  const userId = await ensureAuthUser(blueprint.owner);
  await upsertPublicUser(userId, blueprint.owner);
  const shopId = await ensureShop(userId, blueprint);
  await clearShopCatalog(shopId, shouldReset);
  await insertLabels(shopId, blueprint.labels);
  await insertCatalog(shopId, blueprint);
  return { shopId, userId };
}

async function main() {
  console.log(`Seeding ${LOCAL_MULTI_STOREFRONT_BLUEPRINTS.length} local storefronts...`);
  if (shouldReset) {
    console.log("Reset mode enabled: catalog and historical orders will be removed per shop.");
  }

  for (const blueprint of LOCAL_MULTI_STOREFRONT_BLUEPRINTS) {
    console.log(`- ${blueprint.shop_name_fr} (${blueprint.owner.email})`);
    const seeded = await seedOneShop(blueprint);
    console.log(`  done: shop_id=${seeded.shopId}, owner_id=${seeded.userId}`);
  }
  console.log("Local multi-storefront seed completed.");
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});

