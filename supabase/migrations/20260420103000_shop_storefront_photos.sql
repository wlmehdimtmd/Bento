-- Galerie photos vitrine : gestion multi-photos avec visibilité par photo.

create table if not exists public.shop_storefront_photos (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  image_url text not null,
  caption text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shop_storefront_photos_shop_id_idx
  on public.shop_storefront_photos(shop_id);

create unique index if not exists shop_storefront_photos_shop_image_unique
  on public.shop_storefront_photos(shop_id, image_url);

alter table public.shop_storefront_photos enable row level security;

drop policy if exists "shop_storefront_photos: owner select own" on public.shop_storefront_photos;
create policy "shop_storefront_photos: owner select own"
  on public.shop_storefront_photos for select
  using (
    exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "shop_storefront_photos: owner insert own" on public.shop_storefront_photos;
create policy "shop_storefront_photos: owner insert own"
  on public.shop_storefront_photos for insert
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "shop_storefront_photos: owner update own" on public.shop_storefront_photos;
create policy "shop_storefront_photos: owner update own"
  on public.shop_storefront_photos for update
  using (
    exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "shop_storefront_photos: owner delete own" on public.shop_storefront_photos;
create policy "shop_storefront_photos: owner delete own"
  on public.shop_storefront_photos for delete
  using (
    exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "shop_storefront_photos: public select visible active shop" on public.shop_storefront_photos;
create policy "shop_storefront_photos: public select visible active shop"
  on public.shop_storefront_photos for select
  using (
    is_visible = true
    and exists (
      select 1
      from public.shops s
      where s.id = shop_storefront_photos.shop_id
        and s.is_active = true
    )
  );
