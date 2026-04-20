-- Migration: table de logging des événements d'authentification

CREATE TABLE IF NOT EXISTS public.auth_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event        TEXT NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

-- Seuls les admins (user_role = 'admin' ou 'super_admin' dans le JWT) peuvent lire
CREATE POLICY "admins_can_select_auth_events"
  ON public.auth_events
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') IN ('admin', 'super_admin')
  );

-- Aucun utilisateur ne peut écrire directement (insertion via service role uniquement)
CREATE POLICY "no_direct_insert"
  ON public.auth_events
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
