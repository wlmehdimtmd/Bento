-- Suppression d’un produit ou d’une formule possible même si des commandes
-- historiques y font référence : la ligne garde prix / quantité / options.

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
