import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing Supabase env variables for backfill.");
}

const supabase = createClient(url, serviceRole);

async function run() {
  await supabase.rpc("exec_sql", {
    query: `
      update public.shops set name_en = coalesce(name_en, name_fr, name), description_en = coalesce(description_en, description_fr, description);
      update public.categories set name_en = coalesce(name_en, name_fr, name), description_en = coalesce(description_en, description_fr, description);
      update public.products set name_en = coalesce(name_en, name_fr, name), description_en = coalesce(description_en, description_fr, description), option_label_en = coalesce(option_label_en, option_label_fr, option_label);
      update public.bundles set name_en = coalesce(name_en, name_fr, name), description_en = coalesce(description_en, description_fr, description);
      update public.bundle_slots set label_en = coalesce(label_en, label_fr, label);
      update public.shop_labels set label_en = coalesce(label_en, label_fr, label);
    `,
  });
}

void run();
