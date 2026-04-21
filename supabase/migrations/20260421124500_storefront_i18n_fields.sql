alter table public.shops
  add column if not exists name_fr text,
  add column if not exists name_en text,
  add column if not exists description_fr text,
  add column if not exists description_en text;

alter table public.categories
  add column if not exists name_fr text,
  add column if not exists name_en text,
  add column if not exists description_fr text,
  add column if not exists description_en text;

alter table public.products
  add column if not exists name_fr text,
  add column if not exists name_en text,
  add column if not exists description_fr text,
  add column if not exists description_en text,
  add column if not exists option_label_fr text,
  add column if not exists option_label_en text;

alter table public.bundles
  add column if not exists name_fr text,
  add column if not exists name_en text,
  add column if not exists description_fr text,
  add column if not exists description_en text;

alter table public.bundle_slots
  add column if not exists label_fr text,
  add column if not exists label_en text;

alter table public.shop_labels
  add column if not exists label_fr text,
  add column if not exists label_en text;

update public.shops
set
  name_fr = coalesce(name_fr, name),
  description_fr = coalesce(description_fr, description);

update public.categories
set
  name_fr = coalesce(name_fr, name),
  description_fr = coalesce(description_fr, description);

update public.products
set
  name_fr = coalesce(name_fr, name),
  description_fr = coalesce(description_fr, description),
  option_label_fr = coalesce(option_label_fr, option_label);

update public.bundles
set
  name_fr = coalesce(name_fr, name),
  description_fr = coalesce(description_fr, description);

update public.bundle_slots
set
  label_fr = coalesce(label_fr, label);

update public.shop_labels
set
  label_fr = coalesce(label_fr, label);
