-- Nom d'utilisateur unique (connexion par email ou username)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text;

-- Backfill : slug à partir du nom ou de la partie locale de l'email
DO $$
DECLARE
  r record;
  v_base text;
  v_candidate text;
  suffix int;
BEGIN
  FOR r IN
    SELECT id, email, coalesce(nullif(trim(full_name), ''), '') AS fn
    FROM public.users
    WHERE username IS NULL
  LOOP
    v_base := regexp_replace(lower(trim(r.fn)), '[^a-z0-9]+', '_', 'g');
    v_base := regexp_replace(v_base, '^_+|_+$', '', 'g');
    v_base := regexp_replace(v_base, '_+', '_', 'g');

    IF v_base IS NULL OR length(v_base) < 3 THEN
      v_base := regexp_replace(lower(split_part(coalesce(r.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g');
    END IF;

    IF v_base IS NULL OR length(v_base) < 3 THEN
      v_base := 'user' || substring(replace(r.id::text, '-', ''), 1, 8);
    END IF;

    IF length(v_base) > 30 THEN
      v_base := left(v_base, 30);
    END IF;

    v_candidate := v_base;
    suffix := 0;

    WHILE EXISTS (SELECT 1 FROM public.users u WHERE lower(u.username) = lower(v_candidate)) LOOP
      suffix := suffix + 1;
      v_candidate := left(v_base, 24) || '_' || suffix::text;
      IF length(v_candidate) > 32 THEN
        v_candidate := 'u' || substring(replace(r.id::text, '-', ''), 1, 10) || '_' || suffix::text;
        v_candidate := left(v_candidate, 32);
      END IF;
      IF suffix > 500 THEN
        RAISE EXCEPTION 'users_username backfill: too many collisions for user %', r.id;
      END IF;
    END LOOP;

    UPDATE public.users SET username = lower(v_candidate) WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.users
  ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.users
  ADD CONSTRAINT users_username_format_check
  CHECK (username ~ '^[a-z0-9][a-z0-9_]{2,31}$');

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username));

-- Sync auth -> public.users (username + email + full_name depuis metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
  meta_username text;
  v_base text;
  suffix int := 0;
  attempts int := 0;
BEGIN
  meta_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  IF meta_username IS NOT NULL THEN
    v_username := lower(meta_username);
  ELSE
    v_base := regexp_replace(lower(split_part(coalesce(new.email, 'x@example.invalid'), '@', 1)), '[^a-z0-9_]', '', 'g');
    IF v_base IS NULL OR length(v_base) < 3 THEN
      v_base := 'user';
    END IF;
    v_username := left(v_base, 32);
  END IF;

  IF v_username !~ '^[a-z0-9][a-z0-9_]{2,31}$' OR length(v_username) > 32 THEN
    v_username := 'user' || substring(replace(new.id::text, '-', ''), 1, 8);
  END IF;

  v_username := left(v_username, 32);

  WHILE EXISTS (SELECT 1 FROM public.users u WHERE lower(u.username) = lower(v_username)) LOOP
    suffix := suffix + 1;
    v_base := regexp_replace(lower(split_part(coalesce(new.email, 'x@example.invalid'), '@', 1)), '[^a-z0-9_]', '', 'g');
    IF v_base IS NULL OR length(v_base) < 2 THEN
      v_base := 'u';
    END IF;
    v_username := left(v_base, 20) || '_' || suffix::text;
    v_username := left(v_username, 32);
    attempts := attempts + 1;
    IF attempts > 200 THEN
      v_username := 'u' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 12);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.users (id, email, full_name, avatar_url, username)
  VALUES (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    v_username
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
