import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeTagsForDb } from "@/lib/menu-import-tag-map";
import type { StrictMenuImportPayload } from "@/lib/import/jsonImportSchema";
import type { Database } from "@/lib/supabase/database.types";

type ShopSupabaseClient = SupabaseClient<Database>;

export interface JsonImportResult {
  categoryCount: number;
  productCount: number;
  bundleCount: number;
}

function categoryKey(name: string): string {
  return name.trim().toLowerCase();
}

async function rollbackOnFailure(
  supabase: ShopSupabaseClient,
  createdBundleIds: string[],
  createdProductIds: string[],
  createdCategoryIds: string[]
) {
  if (createdBundleIds.length > 0) {
    await supabase.from("bundle_slots").delete().in("bundle_id", createdBundleIds);
    await supabase.from("bundles").delete().in("id", createdBundleIds);
  }

  if (createdProductIds.length > 0) {
    await supabase.from("products").delete().in("id", createdProductIds);
  }

  if (createdCategoryIds.length > 0) {
    await supabase.from("categories").delete().in("id", createdCategoryIds);
  }
}

export async function importJsonIntoShop(
  supabase: ShopSupabaseClient,
  shopId: string,
  payload: StrictMenuImportPayload
): Promise<JsonImportResult> {
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdBundleIds: string[] = [];

  try {
    const { data: existingCategories, error: existingCatError } = await supabase
      .from("categories")
      .select("id, name, display_order")
      .eq("shop_id", shopId);

    if (existingCatError) {
      throw new Error(existingCatError.message);
    }

    const categoryNameToId = new Map<string, string>();
    const categoryNameToDisplayName = new Map<string, string>();
    let maxCategoryOrder = -1;

    for (const cat of existingCategories ?? []) {
      const key = categoryKey(cat.name);
      categoryNameToId.set(key, cat.id);
      categoryNameToDisplayName.set(key, cat.name);
      maxCategoryOrder = Math.max(maxCategoryOrder, cat.display_order ?? 0);
    }

    const categoriesToCreate = payload.categories.filter(
      (cat) => !categoryNameToId.has(categoryKey(cat.name))
    );

    for (const category of categoriesToCreate) {
      maxCategoryOrder += 1;
      const { data: insertedCategory, error } = await supabase
        .from("categories")
        .insert({
          shop_id: shopId,
          name: category.name.trim(),
          description: category.description?.trim() || null,
          icon_emoji: category.icon_emoji ?? "📦",
          is_active: category.is_active ?? true,
          display_order: category.display_order ?? maxCategoryOrder,
        })
        .select("id, name")
        .single();

      if (error || !insertedCategory) {
        throw new Error(error?.message ?? "Impossible de créer une catégorie.");
      }

      createdCategoryIds.push(insertedCategory.id);
      const key = categoryKey(insertedCategory.name);
      categoryNameToId.set(key, insertedCategory.id);
      categoryNameToDisplayName.set(key, insertedCategory.name);
      maxCategoryOrder = Math.max(maxCategoryOrder, category.display_order ?? maxCategoryOrder);
    }

    const allReferencedCategoryNames = new Set<string>();
    payload.products.forEach((product) => {
      allReferencedCategoryNames.add(categoryKey(product.category_name));
    });
    payload.bundles.forEach((bundle) => {
      bundle.slots.forEach((slot) => {
        allReferencedCategoryNames.add(categoryKey(slot.category_name));
      });
    });

    const missingCategories = [...allReferencedCategoryNames].filter(
      (key) => !categoryNameToId.has(key)
    );
    if (missingCategories.length > 0) {
      throw new Error(
        `Catégories introuvables dans le JSON: ${missingCategories.join(", ")}. Ajoutez-les dans categories[].`
      );
    }

    const productMaxOrderByCategory = new Map<string, number>();
    for (const product of payload.products) {
      const key = categoryKey(product.category_name);
      const categoryId = categoryNameToId.get(key);
      if (!categoryId) {
        throw new Error(`Catégorie introuvable pour le produit "${product.name}".`);
      }

      let nextDisplayOrder: number;
      if (product.display_order !== undefined) {
        nextDisplayOrder = product.display_order;
      } else if (productMaxOrderByCategory.has(categoryId)) {
        nextDisplayOrder = (productMaxOrderByCategory.get(categoryId) ?? -1) + 1;
      } else {
        const { data: lastProduct, error: lastProductError } = await supabase
          .from("products")
          .select("display_order")
          .eq("category_id", categoryId)
          .order("display_order", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastProductError) {
          throw new Error(lastProductError.message);
        }

        nextDisplayOrder = (lastProduct?.display_order ?? -1) + 1;
      }

      const { data: insertedProduct, error } = await supabase
        .from("products")
        .insert({
          category_id: categoryId,
          name: product.name.trim(),
          description: product.description?.trim() || null,
          price: product.price,
          tags: normalizeTagsForDb(product.tags ?? []),
          option_label: product.option_label?.trim() || null,
          is_available: product.is_available ?? true,
          display_order: nextDisplayOrder,
        })
        .select("id")
        .single();

      if (error || !insertedProduct) {
        throw new Error(error?.message ?? `Impossible de créer le produit "${product.name}".`);
      }

      createdProductIds.push(insertedProduct.id);
      productMaxOrderByCategory.set(categoryId, nextDisplayOrder);
    }

    for (const bundle of payload.bundles) {
      const { data: insertedBundle, error: bundleError } = await supabase
        .from("bundles")
        .insert({
          shop_id: shopId,
          name: bundle.name.trim(),
          description: bundle.description?.trim() || null,
          price: bundle.price,
          is_active: bundle.is_active ?? true,
        })
        .select("id")
        .single();

      if (bundleError || !insertedBundle) {
        throw new Error(
          bundleError?.message ?? `Impossible de créer la formule "${bundle.name}".`
        );
      }

      createdBundleIds.push(insertedBundle.id);

      const slotsPayload = bundle.slots.map((slot, index) => {
        const key = categoryKey(slot.category_name);
        const categoryId = categoryNameToId.get(key);

        if (!categoryId) {
          throw new Error(
            `Catégorie introuvable pour le slot de la formule "${bundle.name}" (${slot.category_name}).`
          );
        }

        return {
          bundle_id: insertedBundle.id,
          category_id: categoryId,
          label: slot.label?.trim() || categoryNameToDisplayName.get(key) || slot.category_name.trim(),
          quantity: slot.quantity,
          display_order: index,
        };
      });

      const { error: slotError } = await supabase.from("bundle_slots").insert(slotsPayload);
      if (slotError) {
        throw new Error(slotError.message);
      }
    }

    return {
      categoryCount: createdCategoryIds.length,
      productCount: createdProductIds.length,
      bundleCount: createdBundleIds.length,
    };
  } catch (error) {
    await rollbackOnFailure(
      supabase,
      createdBundleIds,
      createdProductIds,
      createdCategoryIds
    );
    throw error;
  }
}
