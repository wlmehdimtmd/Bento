-- À exécuter une fois dans Supabase : SQL Editor → Run
-- Corrige : « delete on table products violates order_items_product_id_fkey »
-- en mettant la FK en ON DELETE SET NULL (idem formules → bundle_id).

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id)
  references public.products (id)
  on delete set null;

alter table public.order_items
  drop constraint if exists order_items_bundle_id_fkey;

alter table public.order_items
  add constraint order_items_bundle_id_fkey
  foreign key (bundle_id)
  references public.bundles (id)
  on delete set null;
