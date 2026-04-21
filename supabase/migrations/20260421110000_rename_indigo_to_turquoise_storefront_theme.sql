update public.shops
set storefront_theme_key = 'turquoise'
where storefront_theme_key = 'indigo';

alter table public.shops
alter column storefront_theme_key set default 'turquoise';
