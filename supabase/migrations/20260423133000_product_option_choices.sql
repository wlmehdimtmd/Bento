alter table public.products
  add column if not exists option_choices text[] not null default '{}';
