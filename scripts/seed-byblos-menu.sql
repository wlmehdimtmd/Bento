-- À exécuter dans Supabase : SQL Editor → New query → Run
-- Boutique cible : celle du propriétaire dont public.users.email = test@bento.local
-- (si plusieurs boutiques, la plus récente par shops.created_at).
--
-- Ce script n’effectue aucune suppression : uniquement INSERT (4 catégories + 16 produits).
-- Vide au préalable formules / catégories / produits côté dashboard ou SQL si besoin.
-- Si une catégorie du même nom existe déjà, vous aurez des doublons de noms : à éviter.

BEGIN;

CREATE TEMP TABLE _seed_target_shop (shop_id uuid PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _seed_target_shop (shop_id)
SELECT s.id
FROM public.shops s
INNER JOIN public.users u ON u.id = s.owner_id
WHERE lower(btrim(u.email)) = lower(btrim('test@bento.local'))
ORDER BY s.created_at DESC
LIMIT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _seed_target_shop) THEN
    RAISE EXCEPTION
      'Aucune boutique pour le propriétaire avec e-mail « test@bento.local » (vérifiez public.users.email et shops.owner_id).';
  END IF;
END $$;

-- Catégories
INSERT INTO public.categories (shop_id, name, icon_emoji, display_order, is_active)
SELECT t.shop_id, v.name, v.icon_emoji, v.display_order, true
FROM _seed_target_shop t
CROSS JOIN (
  VALUES
    ('Burger', '🍔', 0),
    ('Sandwichs', '🥙', 1),
    ('Assiettes', '🍽️', 2),
    ('Salade', '🥗', 3)
) AS v(name, icon_emoji, display_order);

-- Produits (category_id résolu par nom de catégorie + shop)
INSERT INTO public.products (
  category_id,
  name,
  description,
  price,
  tags,
  option_label,
  is_available,
  display_order
)
SELECT c.id, v.name, v.description, v.price, v.tags::jsonb, v.option_label, v.is_available, v.display_order
FROM (
  VALUES
    -- Burger
    (
      'Burger',
      'LE CHEESE',
      'Pain buns du boulanger, steak du boucher, cheddar, oignons, pickles, ketchup, moutarde U.S.A.',
      8.90::numeric,
      '["gluten","milk","mustard"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      1
    ),
    (
      'Burger',
      'LE ROMANAIS',
      'Pain buns du boulanger, steak du boucher, cheddar, ravioles snackées, sauce cèpes.',
      11.50::numeric,
      '["gluten","milk","eggs"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      2
    ),
    (
      'Burger',
      'LE CLASSIQUE',
      'Pain buns du boulanger, steak du boucher, cheddar, sauce biggy, oignon, pickles, coleslaw.',
      11.50::numeric,
      '["gluten","milk","eggs"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      3
    ),
    (
      'Burger',
      'LE Ô CABANON',
      'Pain buns du boulanger, steak du boucher, cheddar, oignons caramélisés, oeuf, sauce BBQ.',
      11.50::numeric,
      '["gluten","milk","eggs"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      4
    ),
    (
      'Burger',
      'LE CHICKEN CREAM',
      'Pain buns du boulanger, poulet pané, coleslaw, crème toum.',
      11.50::numeric,
      '["gluten","milk","eggs"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      5
    ),
    (
      'Burger',
      'LE FRANCHOUILLARD',
      'Pain buns du boulanger, steak du boucher, cheddar, bacon, rösti, sauce bleu, oignons crispy.',
      13.50::numeric,
      '["gluten","milk"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      6
    ),
    -- Sandwichs
    (
      'Sandwichs',
      'LE BYBLOS',
      'Pain libanais, steak à la libanaise, tomate rôtie, oignon, persil, pickles libanais, sauce houmous, frites.',
      12.50::numeric,
      '["gluten","sesame"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      7
    ),
    (
      'Sandwichs',
      'LE CHICHE TAOUK',
      'Pain libanais, émincé de poulet mariné, coleslaw, pickles libanais, crème toum, frites.',
      12.50::numeric,
      '["gluten","eggs"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      8
    ),
    (
      'Sandwichs',
      'LE CHAWARMA',
      'Pain libanais, émincé de boeuf mariné, tomate, oignon, persil, pickles libanais, sauce tahin (crème de sésame), frites.',
      12.50::numeric,
      '["gluten","sesame"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      9
    ),
    (
      'Sandwichs',
      'LA FALAFEL',
      'Pain libanais, falafel, tomate, salade, persil, pickles de betterave, sauce tahine, feuilles de menthe.',
      12.50::numeric,
      '["gluten","sesame","vegan","vegetarian"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      10
    ),
    (
      'Sandwichs',
      'LE FRITE',
      'Pain libanais, frites, coleslaw, pickles libanais, ketchup, crème toum.',
      12.50::numeric,
      '["gluten","eggs","vegetarian"]',
      'Menu (Frites + Boisson) : +4€',
      true,
      11
    ),
    -- Assiettes
    (
      'Assiettes',
      'ASSIETTE LE BYBLOS',
      'Steak à la libanaise, frites, salade fattouche, sauce houmous.',
      12.50::numeric,
      '["gluten","sesame"]',
      NULL::text,
      true,
      12
    ),
    (
      'Assiettes',
      'ASSIETTE LE CHAWARMA',
      'Émincé de bœuf mariné, frites, salade fattouche, sauce tahine.',
      12.50::numeric,
      '["gluten","sesame"]',
      NULL::text,
      true,
      13
    ),
    (
      'Assiettes',
      'ASSIETTE LE CHICHE TAOUK',
      'Poulet mariné, frites, salade fattouche, crème toum.',
      12.50::numeric,
      '["gluten"]',
      NULL::text,
      true,
      14
    ),
    (
      'Assiettes',
      'LE LIBANAIS',
      'Steak à la libanaise, poulet à la libanaise, frites, salade fattouch, crème toum et sauce houmous.',
      12.50::numeric,
      '["gluten","sesame"]',
      NULL::text,
      true,
      15
    ),
    -- Salade
    (
      'Salade',
      'SALADE FATTOUCHE',
      'Salade, tomate, concombre, pain séché, menthe, sauce libanaise.',
      9.50::numeric,
      '["gluten","vegan","vegetarian"]',
      NULL::text,
      true,
      16
    )
) AS v(
  category_name,
  name,
  description,
  price,
  tags,
  option_label,
  is_available,
  display_order
)
CROSS JOIN _seed_target_shop ts
JOIN LATERAL (
  SELECT c.id
  FROM public.categories c
  WHERE c.shop_id = ts.shop_id
    AND c.name = v.category_name
  ORDER BY c.display_order, c.created_at DESC
  LIMIT 1
) c ON true;

COMMIT;
