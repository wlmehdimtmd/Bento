-- À exécuter une fois dans Supabase : SQL Editor → New query → Run
-- Active l’option « formules regroupées sous la carte Menu » sur la vitrine.

alter table public.shops
  add column if not exists bundles_menu_grouped boolean not null default false;

comment on column public.shops.bundles_menu_grouped is
  'Si vrai, une seule tuile bento « Menu » remplace les tuiles individuelles des formules actives.';
