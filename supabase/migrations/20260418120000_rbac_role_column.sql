-- Migration: ajouter colonne role sur profiles et hook JWT
-- IMPORTANT: après application, activer le hook manuellement dans
-- Supabase Dashboard > Authentication > Hooks > custom_access_token_hook

-- 1. Ajouter la colonne role sur la table users (synced depuis auth.users)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Marquer l'admin existant (à adapter selon l'UUID réel)
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@bento.local';

-- 3. Function hook JWT — injecte user_role dans les claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  claims jsonb;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'user')));
  return jsonb_set(event, '{claims}', claims);
END;
$$;

-- 4. Donner les droits d'exécution au rôle supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
