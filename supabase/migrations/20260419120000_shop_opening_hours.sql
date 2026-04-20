-- Horaires d'ouverture vitrine + fuseau + jours fériés (métadonnées côté app)
alter table public.shops
  add column if not exists opening_hours jsonb,
  add column if not exists opening_timezone text not null default 'Europe/Paris',
  add column if not exists open_on_public_holidays boolean not null default false;

comment on column public.shops.opening_hours is
  'Grille hebdo JSON (jours 0–6 = dim–sam, créneaux HH:mm) ; null si non renseigné.';
comment on column public.shops.opening_timezone is
  'Fuseau IANA pour évaluer ouvert/fermé (ex. Europe/Paris).';
comment on column public.shops.open_on_public_holidays is
  'Si false : fermé les jours fériés FR métropole ; si true : applique la grille du jour de la semaine.';
