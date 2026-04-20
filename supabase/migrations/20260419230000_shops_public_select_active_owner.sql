-- Réduit l’exposition : lecture publique limitée aux boutiques actives.
-- Les propriétaires voient toujours leur boutique (y compris inactive).

drop policy if exists "shops: public select" on public.shops;

create policy "shops: public select active only"
  on public.shops for select
  using (is_active = true);

create policy "shops: owner select own"
  on public.shops for select
  using (auth.uid() = owner_id);
