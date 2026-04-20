alter table public.shops
add column if not exists storefront_theme_key text not null default 'indigo';

comment on column public.shops.storefront_theme_key is
  'Palette visuelle appliquee a la vitrine publique et a son apercu back-office.';
