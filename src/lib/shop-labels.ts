import type { SupabaseClient } from "@supabase/supabase-js";

import { LABELS } from "@/lib/constants";
import { pickLocalized, type AppLocale } from "@/lib/i18n";

export interface ShopLabelOption {
  id: string;
  shop_id: string;
  value: string;
  label: string;
  label_fr?: string | null;
  label_en?: string | null;
  color: string;
  display_order: number;
}

export type ProductLabelOption = Pick<ShopLabelOption, "value" | "label" | "color">;

export const MAX_SHOP_LABELS = 50;

export const DEFAULT_PRODUCT_LABELS: ProductLabelOption[] = LABELS.map((label) => ({
  value: label.value,
  label: label.label,
  color: label.color,
}));

export function normalizeLabelValue(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export async function seedDefaultShopLabels(
  supabase: SupabaseClient,
  shopId: string
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("shop_labels")
    .select("id", { head: true, count: "exact" })
    .eq("shop_id", shopId);

  if (countError) {
    console.error("[shop-labels] count failed", countError);
    return;
  }

  if ((count ?? 0) > 0) return;

  const payload = DEFAULT_PRODUCT_LABELS.slice(0, MAX_SHOP_LABELS).map((item, index) => ({
    shop_id: shopId,
    value: item.value,
    label: item.label,
    label_fr: item.label,
    label_en: null,
    color: item.color,
    display_order: index,
  }));

  const { error: insertError } = await supabase
    .from("shop_labels")
    .insert(payload);

  if (insertError && insertError.code !== "23505") {
    console.error("[shop-labels] seed failed", insertError);
  }
}

export async function fetchShopLabelsForDashboard(
  supabase: SupabaseClient,
  shopId: string
): Promise<ShopLabelOption[]> {
  await seedDefaultShopLabels(supabase, shopId);

  const { data, error } = await supabase
    .from("shop_labels")
    .select("id, shop_id, value, label, label_fr, label_en, color, display_order")
    .eq("shop_id", shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[shop-labels] fetch dashboard labels failed", error);
    return [];
  }

  return (data ?? []) as ShopLabelOption[];
}

export async function fetchShopLabelsForPublic(
  supabase: SupabaseClient,
  shopId: string,
  locale: AppLocale = "fr"
): Promise<ProductLabelOption[]> {
  const { data, error } = await supabase
    .from("shop_labels")
    .select("value, label, label_fr, label_en, color")
    .eq("shop_id", shopId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[shop-labels] fetch public labels failed", error);
    return [];
  }

  type Row = {
    value: string;
    label: string;
    label_fr?: string | null;
    label_en?: string | null;
    color: string;
  };

  return ((data ?? []) as Row[])
    .filter((row) => row.value && row.color)
    .map((row) => ({
      value: row.value,
      label:
        pickLocalized(locale, {
          fr: row.label_fr,
          en: row.label_en,
          legacy: row.label,
        }) ?? row.label,
      color: row.color,
    }));
}
