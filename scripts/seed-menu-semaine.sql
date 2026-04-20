-- A executer dans Supabase : SQL Editor -> New query -> Run
-- Ce script ajoute la carte de la semaine + formules pour UNE boutique ciblee par email proprietaire.
-- Il n'effectue aucune suppression.

BEGIN;

-- Remplacez uniquement cette valeur.
CREATE TEMP TABLE _seed_input (owner_email text NOT NULL);
INSERT INTO _seed_input (owner_email) VALUES ('bonjourmichel545@proton.me');

CREATE TEMP TABLE _seed_target_shop (shop_id uuid PRIMARY KEY);

INSERT INTO _seed_target_shop (shop_id)
SELECT s.id
FROM public.shops s
INNER JOIN public.users u ON u.id = s.owner_id
JOIN _seed_input i ON true
WHERE lower(btrim(u.email)) = lower(btrim(i.owner_email))
ORDER BY s.created_at DESC
LIMIT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _seed_target_shop) THEN
    RAISE EXCEPTION
      'Aucune boutique pour le proprietaire avec e-mail « % » (verifiez public.users.email et shops.owner_id).',
      (SELECT owner_email FROM _seed_input LIMIT 1);
  END IF;
END $$;

-- Regroupement visuel des formules dans la vitrine.
UPDATE public.shops s
SET bundles_menu_grouped = true
FROM _seed_target_shop t
WHERE s.id = t.shop_id;

-- CATEGORIES
INSERT INTO public.categories (shop_id, name, icon_emoji, display_order, is_active)
SELECT t.shop_id, v.name, v.icon_emoji, v.display_order, true
FROM _seed_target_shop t
CROSS JOIN (
  VALUES
    ('Entrées', '🥗', 0),
    ('Plats', '🍽️', 1),
    ('Desserts', '🍰', 2),
    ('Vins', '🍷', 3),
    ('Bières & Softs', '🍺', 4),
    ('Fin de repas', '☕', 5)
) AS v(name, icon_emoji, display_order);

-- PRODUITS
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
SELECT c.id, v.name, v.description, v.price, v.tags::jsonb, NULL::text, true, v.display_order
FROM (
  VALUES
    -- Entrees
    (
      'Entrées',
      'L''Œuf Parfait',
      'Cuit a 64°C, veloute de courge butternut du maraicher, eclats de chataignes d''Ardeche roties.',
      9.00::numeric,
      '[]',
      1
    ),
    (
      'Entrées',
      'Le Gravlax',
      'Truite du Vercors marinee aux baies roses, creme crue ciboulette et pickles d''oignons rouges.',
      11.00::numeric,
      '[]',
      2
    ),
    (
      'Entrées',
      'Le Pâté en Croûte du Chef',
      'Porc plein air de la Drome, pistaches, pickles de legumes de saison.',
      10.00::numeric,
      '[]',
      3
    ),
    -- Plats
    (
      'Plats',
      'La Traditionnelle',
      'Veritable gratin de ravioles du Dauphine de la Mere Maury, creme de cepes et tuile de parmesan.',
      18.00::numeric,
      '[]',
      4
    ),
    (
      'Plats',
      'Le Retour de Pêche',
      'Filet de sandre roti sur peau, fondue de poireaux, sauce beurre blanc aux agrumes.',
      22.00::numeric,
      '[]',
      5
    ),
    (
      'Plats',
      'La Pièce du Boucher',
      'Faux-filet de bœuf (race Aubrac), pommes grenailles sautees a la graisse de canard, jus corse au thym.',
      24.00::numeric,
      '[]',
      6
    ),
    -- Desserts
    (
      'Desserts',
      'Le Local',
      'Veritable Pogne de Romans facon "pain perdu", caramel au beurre sale et boule de glace vanille de Madagascar.',
      8.00::numeric,
      '[]',
      7
    ),
    (
      'Desserts',
      'Le Chocolatier',
      'Mousse onctueuse au chocolat noir Valrhona 70%, pointe de fleur de sel et grue de cacao.',
      9.00::numeric,
      '[]',
      8
    ),
    (
      'Desserts',
      'La Fraîcheur',
      'Tartelette destructuree au citron jaune, meringue italienne brulee au chalumeau.',
      8.00::numeric,
      '[]',
      9
    ),
    -- Vins
    (
      'Vins',
      'Rouge - Crozes-Hermitage, Domaine Combier (12cl)',
      'Service au verre 12cl.',
      7.00::numeric,
      '[]',
      10
    ),
    (
      'Vins',
      'Rouge - Crozes-Hermitage, Domaine Combier (75cl)',
      'Service bouteille 75cl.',
      35.00::numeric,
      '[]',
      11
    ),
    (
      'Vins',
      'Rouge - Saint-Joseph, Cave de Tain (12cl)',
      'Service au verre 12cl.',
      8.00::numeric,
      '[]',
      12
    ),
    (
      'Vins',
      'Rouge - Saint-Joseph, Cave de Tain (75cl)',
      'Service bouteille 75cl.',
      42.00::numeric,
      '[]',
      13
    ),
    (
      'Vins',
      'Blanc - Viognier IGP Collines Rhodaniennes (12cl)',
      'Service au verre 12cl.',
      6.00::numeric,
      '[]',
      14
    ),
    (
      'Vins',
      'Blanc - Viognier IGP Collines Rhodaniennes (75cl)',
      'Service bouteille 75cl.',
      28.00::numeric,
      '[]',
      15
    ),
    (
      'Vins',
      'Blanc - Saint-Péray, Domaine du Tunnel (12cl)',
      'Service au verre 12cl.',
      9.00::numeric,
      '[]',
      16
    ),
    (
      'Vins',
      'Blanc - Saint-Péray, Domaine du Tunnel (75cl)',
      'Service bouteille 75cl.',
      45.00::numeric,
      '[]',
      17
    ),
    -- Bieres et softs
    (
      'Bières & Softs',
      'Pression locale (25cl)',
      'Biere artisanale locale (Brasserie de la Pleine Lune).',
      4.00::numeric,
      '[]',
      18
    ),
    (
      'Bières & Softs',
      'Pression locale (50cl)',
      'Biere artisanale locale (Brasserie de la Pleine Lune).',
      7.50::numeric,
      '[]',
      19
    ),
    (
      'Bières & Softs',
      'Limonade artisanale de la Drome (33cl)',
      NULL::text,
      4.00::numeric,
      '[]',
      20
    ),
    (
      'Bières & Softs',
      'Jus de fruits locaux (Pomme, Abricot)',
      NULL::text,
      4.50::numeric,
      '[]',
      21
    ),
    -- Fin de repas
    (
      'Fin de repas',
      'Cafe Expresso / Decafeine',
      'Torrefaction artisanale par un maitre torrefacteur de la region.',
      2.20::numeric,
      '[]',
      22
    ),
    (
      'Fin de repas',
      'Cafe Allonge / Noisette',
      NULL::text,
      2.50::numeric,
      '[]',
      23
    ),
    (
      'Fin de repas',
      'Selection de Thes et Infusions bio',
      NULL::text,
      3.50::numeric,
      '[]',
      24
    ),
    (
      'Fin de repas',
      'Digestif - Chartreuse Verte ou Liqueur de Poire Williams',
      NULL::text,
      7.00::numeric,
      '[]',
      25
    )
) AS v(
  category_name,
  name,
  description,
  price,
  tags,
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

-- BUNDLES (formules)
INSERT INTO public.bundles (shop_id, name, description, price, is_active)
SELECT t.shop_id, v.name, v.description, v.price, true
FROM _seed_target_shop t
CROSS JOIN (
  VALUES
    (
      'Formule Complete',
      'Entree + Plat + Dessert.',
      29.00::numeric
    ),
    (
      'Formule Duo (Entree + Plat)',
      'Choisissez 1 entree et 1 plat.',
      23.00::numeric
    ),
    (
      'Formule Duo (Plat + Dessert)',
      'Choisissez 1 plat et 1 dessert.',
      23.00::numeric
    ),
    (
      'Menu Enfant (jusqu''a 12 ans)',
      'Petite raviole, sirop a l''eau et boule de glace.',
      12.00::numeric
    )
) AS v(name, description, price);

-- SLOTS DE FORMULES
INSERT INTO public.bundle_slots (bundle_id, category_id, label, quantity, display_order)
SELECT b.id, c.id, s.label, s.quantity, s.display_order
FROM _seed_target_shop ts
JOIN LATERAL (
  SELECT b.id, b.name
  FROM public.bundles b
  WHERE b.shop_id = ts.shop_id
    AND b.name IN (
      'Formule Complete',
      'Formule Duo (Entree + Plat)',
      'Formule Duo (Plat + Dessert)'
    )
) b ON true
JOIN LATERAL (
  VALUES
    ('Formule Complete', 'Entrées', 'Choisir une entree', 1, 1),
    ('Formule Complete', 'Plats', 'Choisir un plat', 1, 2),
    ('Formule Complete', 'Desserts', 'Choisir un dessert', 1, 3),
    ('Formule Duo (Entree + Plat)', 'Entrées', 'Choisir une entree', 1, 1),
    ('Formule Duo (Entree + Plat)', 'Plats', 'Choisir un plat', 1, 2),
    ('Formule Duo (Plat + Dessert)', 'Plats', 'Choisir un plat', 1, 1),
    ('Formule Duo (Plat + Dessert)', 'Desserts', 'Choisir un dessert', 1, 2)
) AS s(bundle_name, category_name, label, quantity, display_order)
  ON s.bundle_name = b.name
JOIN LATERAL (
  SELECT c.id
  FROM public.categories c
  WHERE c.shop_id = ts.shop_id
    AND c.name = s.category_name
  ORDER BY c.display_order, c.created_at DESC
  LIMIT 1
) c ON true;

COMMIT;

-- Requetes de verification
SELECT
  s.id AS shop_id,
  s.slug,
  s.bundles_menu_grouped,
  (SELECT count(*) FROM public.categories c WHERE c.shop_id = s.id) AS categories_count,
  (SELECT count(*) FROM public.products p
    JOIN public.categories c2 ON c2.id = p.category_id
    WHERE c2.shop_id = s.id) AS products_count,
  (SELECT count(*) FROM public.bundles b WHERE b.shop_id = s.id) AS bundles_count,
  (SELECT count(*) FROM public.bundle_slots bs
    JOIN public.bundles b2 ON b2.id = bs.bundle_id
    WHERE b2.shop_id = s.id) AS bundle_slots_count
FROM public.shops s
JOIN public.users u ON u.id = s.owner_id
JOIN _seed_input i ON true
WHERE lower(btrim(u.email)) = lower(btrim(i.owner_email))
ORDER BY s.created_at DESC
LIMIT 1;
