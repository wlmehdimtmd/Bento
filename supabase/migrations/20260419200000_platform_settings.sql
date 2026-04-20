-- Configuration globale plateforme (ex. boutique miroir pour /demo)
create table if not exists public.platform_settings (
  id              text primary key default 'default',
  demo_shop_id    uuid references public.shops (id) on delete set null,
  updated_at      timestamptz not null default now()
);

insert into public.platform_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

-- Lecture publique (anon) pour afficher /demo ; écritures via service role uniquement
create policy "platform_settings: public select"
  on public.platform_settings for select
  using (true);

comment on table public.platform_settings is
  'Singleton plateforme ; demo_shop_id = boutique affichée sur /demo (null = vitrine intégrée statique).';

comment on column public.platform_settings.demo_shop_id is
  'Si défini, /demo charge la vitrine de cette boutique (active) en mode démo.';

create index if not exists idx_platform_settings_demo_shop_id
  on public.platform_settings (demo_shop_id);
