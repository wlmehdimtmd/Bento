-- Colonnes pour corrélation Checkout Session + horodatage de paiement (webhook).
alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists paid_at timestamptz;

comment on column public.orders.stripe_checkout_session_id is
  'Stripe Checkout Session id (cs_...), rempli après sessions.create et/ou webhook.';
comment on column public.orders.paid_at is
  'Horodatage de confirmation du paiement (ex. checkout.session.completed).';

-- Recherche page succès / audits.
create index if not exists orders_stripe_checkout_session_id_idx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- Au plus une commande par session Checkout.
create unique index if not exists orders_stripe_checkout_session_id_uidx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
