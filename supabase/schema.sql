-- ============================================================
-- BENTO RESTO — Schéma de base de données complet
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLES
-- ============================================================

-- ─── public.users ────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  disable_auto_logout boolean not null default false,
  auto_logout_timeout_minutes integer not null default 15 check (auto_logout_timeout_minutes in (5, 10, 15, 30, 60)),
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;


-- ─── public.shops ────────────────────────────────────────────
create table if not exists public.shops (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.users on delete cascade,
  name                text not null,
  slug                text not null unique,
  type                text not null check (type in (
                        'restaurant','bakery','cafe','foodtruck','catering','other'
                      )),
  description         text,
  logo_url            text,
  cover_image_url     text,
  address             text,
  phone               text,
  email_contact       text,
  social_links        jsonb not null default '{}',
  stripe_account_id   text,
  is_active           boolean not null default true,
  fulfillment_modes   jsonb not null default '["a_emporter"]',
  storefront_bento_layout jsonb,
  opening_hours       jsonb,
  opening_timezone    text not null default 'Europe/Paris',
  open_on_public_holidays boolean not null default false,
  bundles_menu_grouped boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table public.shops enable row level security;


-- ─── public.categories ───────────────────────────────────────
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops on delete cascade,
  name            text not null,
  description     text,
  icon_emoji      text not null default '📦',
  display_order   integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table public.categories enable row level security;


-- ─── public.products ─────────────────────────────────────────
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.categories on delete cascade,
  name          text not null,
  description   text,
  price         decimal(10,2) not null check (price >= 0),
  image_url     text,
  tags          jsonb not null default '[]',
  option_label  text,           -- ex: "Cuisson ?"
  is_available  boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.products enable row level security;


-- ─── public.shop_labels ───────────────────────────────────────
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


-- ─── public.bundles ──────────────────────────────────────────
create table if not exists public.bundles (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops on delete cascade,
  name        text not null,
  description text,
  price       decimal(10,2) not null check (price >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.bundles enable row level security;


-- ─── public.bundle_slots ─────────────────────────────────────
create table if not exists public.bundle_slots (
  id                     uuid primary key default gen_random_uuid(),
  bundle_id              uuid not null references public.bundles on delete cascade,
  category_id            uuid not null references public.categories,
  label                  text not null,   -- ex: "Choisir une entrée"
  quantity               integer not null default 1 check (quantity >= 1),
  display_order          integer not null default 0,
  excluded_product_ids   uuid[] not null default '{}'
);

alter table public.bundle_slots enable row level security;


-- ─── public.orders ───────────────────────────────────────────
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  shop_id                   uuid not null references public.shops,
  order_number              integer not null,
  customer_name             text not null,
  customer_email            text,
  customer_phone            text,
  fulfillment_mode          text not null check (fulfillment_mode in (
                              'dine_in','takeaway','delivery','a_emporter','sur_place','livraison'
                            )),
  table_number              text,
  delivery_address          text,
  status                    text not null default 'pending' check (status in (
                              'pending','confirmed','preparing','ready','delivered','cancelled'
                            )),
  total_amount              decimal(10,2) not null check (total_amount >= 0),
  stripe_payment_intent_id  text,
  stripe_payment_status     text,
  notes                     text,
  created_at                timestamptz not null default now(),
  constraint orders_shop_order_number_unique unique (shop_id, order_number)
);

alter table public.orders enable row level security;


-- ─── public.order_items ──────────────────────────────────────
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders on delete cascade,
  product_id    uuid references public.products on delete set null,
  bundle_id     uuid references public.bundles on delete set null,
  quantity      integer not null default 1 check (quantity >= 1),
  unit_price    decimal(10,2) not null check (unit_price >= 0),
  option_value  text,
  special_note  text
);

alter table public.order_items enable row level security;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- ─── Sync auth.users → public.users ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Auto-increment order_number per shop ────────────────────
create or replace function public.set_order_number()
returns trigger
language plpgsql
as $$
declare
  next_num integer;
begin
  select coalesce(max(order_number), 0) + 1
    into next_num
    from public.orders
   where shop_id = new.shop_id;

  new.order_number := next_num;
  return new;
end;
$$;

drop trigger if exists before_insert_order on public.orders;
create trigger before_insert_order
  before insert on public.orders
  for each row execute procedure public.set_order_number();


-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ─── users ───────────────────────────────────────────────────
create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);


-- ─── shops ───────────────────────────────────────────────────
create policy "shops: public select active only"
  on public.shops for select
  using (is_active = true);

create policy "shops: owner select own"
  on public.shops for select
  using (auth.uid() = owner_id);

create policy "shops: owner insert"
  on public.shops for insert
  with check (auth.uid() = owner_id);

create policy "shops: owner update"
  on public.shops for update
  using (auth.uid() = owner_id);

create policy "shops: owner delete"
  on public.shops for delete
  using (auth.uid() = owner_id);


-- ─── Helper: is_shop_owner(shop_id) ──────────────────────────
create or replace function public.is_shop_owner(p_shop_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shops
     where id = p_shop_id
       and owner_id = auth.uid()
  );
$$;


-- ─── categories ──────────────────────────────────────────────
create policy "categories: public select (active shop)"
  on public.categories for select
  using (
    exists (
      select 1 from public.shops
       where shops.id = categories.shop_id
         and shops.is_active = true
    )
  );

create policy "categories: owner select own"
  on public.categories for select
  using (public.is_shop_owner(shop_id));

create policy "categories: owner insert"
  on public.categories for insert
  with check (public.is_shop_owner(shop_id));

create policy "categories: owner update"
  on public.categories for update
  using (public.is_shop_owner(shop_id));

create policy "categories: owner delete"
  on public.categories for delete
  using (public.is_shop_owner(shop_id));


-- ─── products ────────────────────────────────────────────────
create policy "products: public select (active shop)"
  on public.products for select
  using (
    exists (
      select 1
        from public.categories c
        join public.shops s on s.id = c.shop_id
       where c.id = products.category_id
         and s.is_active = true
    )
  );

create policy "products: owner select own"
  on public.products for select
  using (
    exists (
      select 1
        from public.categories c
       where c.id = products.category_id
         and public.is_shop_owner(c.shop_id)
    )
  );

create policy "products: owner insert"
  on public.products for insert
  with check (
    exists (
      select 1
        from public.categories c
       where c.id = products.category_id
         and public.is_shop_owner(c.shop_id)
    )
  );

create policy "products: owner update"
  on public.products for update
  using (
    exists (
      select 1
        from public.categories c
       where c.id = products.category_id
         and public.is_shop_owner(c.shop_id)
    )
  );

create policy "products: owner delete"
  on public.products for delete
  using (
    exists (
      select 1
        from public.categories c
       where c.id = products.category_id
         and public.is_shop_owner(c.shop_id)
    )
  );


-- ─── shop_labels ───────────────────────────────────────────────
create policy "shop_labels: public select (active shop)"
  on public.shop_labels for select
  using (
    exists (
      select 1 from public.shops
       where shops.id = shop_labels.shop_id
         and shops.is_active = true
    )
  );

create policy "shop_labels: owner select own"
  on public.shop_labels for select
  using (public.is_shop_owner(shop_id));

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


-- ─── bundles ─────────────────────────────────────────────────
create policy "bundles: public select (active shop)"
  on public.bundles for select
  using (
    exists (
      select 1 from public.shops
       where shops.id = bundles.shop_id
         and shops.is_active = true
    )
  );

create policy "bundles: owner select own"
  on public.bundles for select
  using (public.is_shop_owner(shop_id));

create policy "bundles: owner insert"
  on public.bundles for insert
  with check (public.is_shop_owner(shop_id));

create policy "bundles: owner update"
  on public.bundles for update
  using (public.is_shop_owner(shop_id));

create policy "bundles: owner delete"
  on public.bundles for delete
  using (public.is_shop_owner(shop_id));


-- ─── bundle_slots ────────────────────────────────────────────
create policy "bundle_slots: public select"
  on public.bundle_slots for select
  using (
    exists (
      select 1
        from public.bundles b
        join public.shops s on s.id = b.shop_id
       where b.id = bundle_slots.bundle_id
         and s.is_active = true
    )
  );

create policy "bundle_slots: owner select own"
  on public.bundle_slots for select
  using (
    exists (
      select 1
        from public.bundles b
       where b.id = bundle_slots.bundle_id
         and public.is_shop_owner(b.shop_id)
    )
  );

create policy "bundle_slots: owner insert"
  on public.bundle_slots for insert
  with check (
    exists (
      select 1
        from public.bundles b
       where b.id = bundle_slots.bundle_id
         and public.is_shop_owner(b.shop_id)
    )
  );

create policy "bundle_slots: owner update"
  on public.bundle_slots for update
  using (
    exists (
      select 1
        from public.bundles b
       where b.id = bundle_slots.bundle_id
         and public.is_shop_owner(b.shop_id)
    )
  );

create policy "bundle_slots: owner delete"
  on public.bundle_slots for delete
  using (
    exists (
      select 1
        from public.bundles b
       where b.id = bundle_slots.bundle_id
         and public.is_shop_owner(b.shop_id)
    )
  );


-- ─── orders ──────────────────────────────────────────────────
-- Insert public : boutique cible active uniquement
create policy "orders: public insert active shop only"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.shops s
      where s.id = shop_id
        and s.is_active = true
    )
  );

-- Shop owner can select their orders
create policy "orders: shop owner select"
  on public.orders for select
  using (public.is_shop_owner(shop_id));

-- Shop owner can update order status
create policy "orders: shop owner update"
  on public.orders for update
  using (public.is_shop_owner(shop_id));


-- ─── order_items ─────────────────────────────────────────────
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

-- Shop owner can select items of their orders
create policy "order_items: shop owner select"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
       where o.id = order_items.order_id
         and public.is_shop_owner(o.shop_id)
    )
  );


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these via the Supabase dashboard or CLI after applying this schema.
-- They are included here as reference comments since SQL cannot create storage buckets.
--
-- Bucket: shop-assets   (public)  — logos, covers, owner photos
-- Bucket: product-images (public) — product images
--
-- Storage policies (apply in Supabase dashboard > Storage > Policies):
--
-- shop-assets:
--   SELECT (public): true
--   INSERT: auth.uid() is not null
--   UPDATE: auth.uid() is not null
--   DELETE: auth.uid() is not null
--
-- product-images:
--   SELECT (public): true
--   INSERT: auth.uid() is not null
--   UPDATE: auth.uid() is not null
--   DELETE: auth.uid() is not null


-- ─── public.platform_settings ────────────────────────────────────────────────
-- Singleton (id = 'default'). demo_shop_id = boutique affichée sur /demo (null = démo intégrée).
create table if not exists public.platform_settings (
  id              text primary key default 'default',
  demo_shop_id    uuid references public.shops (id) on delete set null,
  updated_at      timestamptz not null default now()
);

insert into public.platform_settings (id) values ('default') on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

create policy "platform_settings: public select"
  on public.platform_settings for select
  using (true);


-- ─── public.shop_reviews ─────────────────────────────────────────────────────
-- One row per shop. Stores cached Google + TripAdvisor ratings.
create table if not exists public.shop_reviews (
  shop_id                    uuid primary key references public.shops on delete cascade,
  -- Google Places
  google_enabled             boolean not null default false,
  google_place_id            text,
  google_place_name          text,
  google_place_address       text,
  google_rating              numeric(3,1),
  google_review_count        integer,
  google_url                 text,
  google_last_fetched        timestamptz,
  -- TripAdvisor
  tripadvisor_enabled        boolean not null default false,
  tripadvisor_url            text,
  tripadvisor_name           text,
  tripadvisor_rating         numeric(3,1),
  tripadvisor_review_count   integer,
  tripadvisor_last_fetched   timestamptz,
  -- Metadata
  updated_at                 timestamptz not null default now()
);

alter table public.shop_reviews enable row level security;

create policy "shop_reviews: public select"
  on public.shop_reviews for select
  using (true);

create policy "shop_reviews: owner insert"
  on public.shop_reviews for insert
  with check (public.is_shop_owner(shop_id));

create policy "shop_reviews: owner update"
  on public.shop_reviews for update
  using (public.is_shop_owner(shop_id));


-- ============================================================
-- INDEXES (performance)
-- ============================================================
create index if not exists idx_shops_owner_id      on public.shops (owner_id);
create index if not exists idx_shops_slug           on public.shops (slug);
create index if not exists idx_categories_shop_id   on public.categories (shop_id);
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_shop_labels_shop_id on public.shop_labels (shop_id);
create index if not exists idx_shop_labels_shop_id_display_order
  on public.shop_labels (shop_id, display_order);
create index if not exists idx_bundles_shop_id      on public.bundles (shop_id);
create index if not exists idx_bundle_slots_bundle  on public.bundle_slots (bundle_id);
create index if not exists idx_orders_shop_id       on public.orders (shop_id);
create index if not exists idx_orders_created_at    on public.orders (created_at desc);
create index if not exists idx_order_items_order_id on public.order_items (order_id);
create index if not exists idx_shop_reviews_shop_id  on public.shop_reviews (shop_id);
create index if not exists idx_platform_settings_demo_shop_id on public.platform_settings (demo_shop_id);
