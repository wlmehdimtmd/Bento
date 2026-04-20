-- À exécuter une fois dans Supabase : SQL Editor → New query → Run
-- Corrige l’erreur d’enregistrement de la mise en page vitrine (colonne manquante).

alter table public.shops
  add column if not exists storefront_bento_layout jsonb;

comment on column public.shops.storefront_bento_layout is
  'Grille vitrine niveau 1 (JSON: { lg: Layout[] }).';
