-- Suppression de l'ancien champ photo chef/propriétaire.
alter table public.shops
  drop column if exists owner_photo_url;
