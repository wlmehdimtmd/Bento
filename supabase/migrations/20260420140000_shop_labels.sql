-- Labels personnalisables par boutique (badges produits).

create table if not exists public.shop_labels (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops on delete cascade,
  value         text not null,
  label         text not null,
  color         text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (shop_id, value),
  constraint shop_labels_value_format check (value ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint shop_labels_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint shop_labels_label_not_blank check (btrim(label) <> '')
);

alter table public.shop_labels enable row level security;

create index if not exists idx_shop_labels_shop_id
  on public.shop_labels (shop_id);

create index if not exists idx_shop_labels_shop_id_display_order
  on public.shop_labels (shop_id, display_order);

create or replace function public.set_shop_labels_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_shop_labels_updated_at on public.shop_labels;
create trigger trg_shop_labels_updated_at
before update on public.shop_labels
for each row execute function public.set_shop_labels_updated_at();

create or replace function public.enforce_shop_labels_limit()
returns trigger
language plpgsql
as $$
declare
  labels_count integer;
begin
  select count(*)
  into labels_count
  from public.shop_labels
  where shop_id = new.shop_id;

  if labels_count >= 50 then
    raise exception using
      errcode = 'P0001',
      message = 'SHOP_LABEL_LIMIT_REACHED',
      detail = 'Maximum 50 labels par boutique.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_shop_labels_limit on public.shop_labels;
create trigger trg_enforce_shop_labels_limit
before insert on public.shop_labels
for each row execute function public.enforce_shop_labels_limit();

create policy "shop_labels: public select (active shop)"
  on public.shop_labels for select
  using (
    exists (
      select 1 from public.shops
       where shops.id = shop_labels.shop_id
         and shops.is_active = true
    )
  );

create policy "shop_labels: owner insert"
  on public.shop_labels for insert
  with check (public.is_shop_owner(shop_id));

create policy "shop_labels: owner update"
  on public.shop_labels for update
  using (public.is_shop_owner(shop_id))
  with check (public.is_shop_owner(shop_id));

create policy "shop_labels: owner delete"
  on public.shop_labels for delete
  using (public.is_shop_owner(shop_id));
