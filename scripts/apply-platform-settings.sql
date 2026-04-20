-- À exécuter une fois dans Supabase : SQL Editor → New query → Run
-- (équivalent à supabase/migrations/20260419200000_platform_settings.sql)

create table if not exists public.platform_settings (
  id              text primary key default 'default',
  demo_shop_id    uuid references public.shops (id) on delete set null,
  updated_at      timestamptz not null default now()
);

insert into public.platform_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings: public select" on public.platform_settings;

create policy "platform_settings: public select"
  on public.platform_settings for select
  using (true);

create index if not exists idx_platform_settings_demo_shop_id
  on public.platform_settings (demo_shop_id);
