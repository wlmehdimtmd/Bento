-- Permet au propriétaire de lire le catalogue même si la boutique est inactive.
-- La vitrine anonyme reste limitée aux politiques « public select (active shop) ».

-- Sur certains projets la fonction n’existait pas encore : la rendre idempotente.
create or replace function public.is_shop_owner(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shops
     where id = p_shop_id
       and owner_id = auth.uid()
  );
$$;

drop policy if exists "categories: owner select own" on public.categories;
create policy "categories: owner select own"
  on public.categories for select
  using (public.is_shop_owner(shop_id));

drop policy if exists "products: owner select own" on public.products;
create policy "products: owner select own"
  on public.products for select
  using (
    exists (
      select 1
        from public.categories c
       where c.id = products.category_id
         and public.is_shop_owner(c.shop_id)
    )
  );

drop policy if exists "bundles: owner select own" on public.bundles;
create policy "bundles: owner select own"
  on public.bundles for select
  using (public.is_shop_owner(shop_id));

drop policy if exists "bundle_slots: owner select own" on public.bundle_slots;
create policy "bundle_slots: owner select own"
  on public.bundle_slots for select
  using (
    exists (
      select 1
        from public.bundles b
       where b.id = bundle_slots.bundle_id
         and public.is_shop_owner(b.shop_id)
    )
  );

drop policy if exists "shop_labels: owner select own" on public.shop_labels;
create policy "shop_labels: owner select own"
  on public.shop_labels for select
  using (public.is_shop_owner(shop_id));
