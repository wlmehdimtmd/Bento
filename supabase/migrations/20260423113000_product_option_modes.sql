alter table public.products
  add column if not exists option_mode text not null default 'none',
  add column if not exists option_price_delta numeric(10,2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_option_mode_check'
  ) then
    alter table public.products
      add constraint products_option_mode_check
      check (option_mode in ('none', 'free', 'paid'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_option_price_delta_non_negative_check'
  ) then
    alter table public.products
      add constraint products_option_price_delta_non_negative_check
      check (option_price_delta >= 0);
  end if;
end $$;

update public.products
set option_mode = 'free'
where option_mode = 'none'
  and coalesce(option_label, option_label_fr, option_label_en) is not null;
