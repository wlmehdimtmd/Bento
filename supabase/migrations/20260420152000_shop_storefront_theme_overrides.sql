alter table public.shops
add column if not exists storefront_theme_overrides jsonb;

comment on column public.shops.storefront_theme_overrides is
  'Overrides custom des palettes de la vitrine publique (par theme key).';
