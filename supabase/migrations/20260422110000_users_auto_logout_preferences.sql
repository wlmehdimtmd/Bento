-- Préférences de déconnexion automatique par compte marchand
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS disable_auto_logout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_logout_timeout_minutes integer NOT NULL DEFAULT 15;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_auto_logout_timeout_minutes_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_auto_logout_timeout_minutes_check
  CHECK (auto_logout_timeout_minutes IN (5, 10, 15, 30, 60));
