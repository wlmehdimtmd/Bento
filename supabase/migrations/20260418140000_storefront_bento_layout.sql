-- Layout vitrine (niveau 1) : positions tuiles pour /{slug}
alter table public.shops
  add column if not exists storefront_bento_layout jsonb;

comment on column public.shops.storefront_bento_layout is
  'Grille vitrine niveau 1 (react-grid-layout JSON: { lg: Layout[] }).';
