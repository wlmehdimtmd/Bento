-- Inserts commandes : boutique cible doit être active.
-- Lignes de commande : commande parente pending + boutique active.

drop policy if exists "orders: public insert" on public.orders;
drop policy if exists "order_items: public insert" on public.order_items;

create policy "orders: public insert active shop only"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id
        and s.is_active = true
    )
  );

create policy "order_items: public insert pending order active shop"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      join public.shops s on s.id = o.shop_id
      where o.id = order_id
        and o.status = 'pending'
        and s.is_active = true
    )
  );
