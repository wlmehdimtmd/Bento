-- Plats non proposés pour un slot de formule (liste technique côté serveur).
alter table public.bundle_slots
  add column if not exists excluded_product_ids uuid[] not null default '{}';

comment on column public.bundle_slots.excluded_product_ids is
  'Product IDs in this category that must not appear in the bundle step (empty = all category products can be offered).';
