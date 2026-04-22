import { z } from "zod";

/** Tuile alignée sur react-grid-layout (grille 4 colonnes, unités en cellules). */
export const storefrontBentoLayoutItemSchema = z.object({
  i: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  minW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
  maxW: z.number().int().optional(),
  maxH: z.number().int().optional(),
});

export const storefrontBentoLayoutDocSchema = z.object({
  lg: z.array(storefrontBentoLayoutItemSchema),
});

export type StorefrontBentoLayoutItem = z.infer<typeof storefrontBentoLayoutItemSchema>;
export type StorefrontBentoLayoutDoc = z.infer<typeof storefrontBentoLayoutDocSchema>;

export const STOREFRONT_BENTO_COLS = 4;

export function parseStorefrontBentoLayout(raw: unknown): StorefrontBentoLayoutDoc | null {
  const r = storefrontBentoLayoutDocSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Identifiants stables des tuiles. */
export function categoryTileId(id: string) {
  return `category:${id}` as const;
}

export function bundleTileId(id: string) {
  return `bundle:${id}` as const;
}

/** Tuile unique regroupant toutes les formules actives (vitrine niveau 1). */
export const BUNDLES_MENU_TILE_ID = "bundles:menu" as const;

export const INFO_TILE_ID = "info";
export const GALLERY_TILE_ID = "gallery";

/**
 * Disposition par défaut (proche du rendu historique) : fiche 2×2 à gauche,
 * catégories 1×1 sur la droite en 2 colonnes, formules 2×1 en dessous.
 * Si `bundlesMenuGrouped` est vrai et qu’il y a au moins une formule, une seule tuile `bundles:menu`.
 */
export function buildDefaultStorefrontLayout(
  categoryIds: string[],
  bundleIds: string[],
  options?: { bundlesMenuGrouped?: boolean; includeGallery?: boolean }
): StorefrontBentoLayoutItem[] {
  const items: StorefrontBentoLayoutItem[] = [
    {
      i: INFO_TILE_ID,
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      minW: 1,
      minH: 1,
      maxW: STOREFRONT_BENTO_COLS,
      maxH: 8,
    },
  ];

  for (let idx = 0; idx < categoryIds.length; idx++) {
    const id = categoryIds[idx];
    items.push({
      i: categoryTileId(id),
      x: 2 + (idx % 2),
      y: Math.floor(idx / 2),
      w: 1,
      h: 1,
      minW: 1,
      minH: 1,
      maxW: STOREFRONT_BENTO_COLS,
      maxH: 8,
    });
  }

  const catRows = categoryIds.length === 0 ? 0 : Math.floor((categoryIds.length - 1) / 2) + 1;
  const startY = Math.max(2, catRows);

  const menuGrouped = Boolean(options?.bundlesMenuGrouped) && bundleIds.length > 0;
  const includeGallery = Boolean(options?.includeGallery);

  if (menuGrouped) {
    items.push({
      i: BUNDLES_MENU_TILE_ID,
      x: 0,
      y: startY,
      w: 2,
      h: 1,
      minW: 1,
      minH: 1,
      maxW: STOREFRONT_BENTO_COLS,
      maxH: 8,
    });
  } else {
    for (let bi = 0; bi < bundleIds.length; bi++) {
      const id = bundleIds[bi];
      const row = Math.floor(bi / 2);
      const col = (bi % 2) * 2;
      items.push({
        i: bundleTileId(id),
        x: col,
        y: startY + row,
        w: 2,
        h: 1,
        minW: 1,
        minH: 1,
        maxW: STOREFRONT_BENTO_COLS,
        maxH: 8,
      });
    }
  }

  if (includeGallery) {
    const maxY = items.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
    items.push({
      i: GALLERY_TILE_ID,
      x: 0,
      y: maxY,
      w: 2,
      h: 1,
      minW: 1,
      minH: 1,
      maxW: STOREFRONT_BENTO_COLS,
      maxH: 8,
    });
  }

  return items;
}

/**
 * Pour chaque tuile du canevas par défaut, reprend x/y/w/h sauvegardés si présents
 * (sinon place par défaut). Conserve les min/max issus du défaut.
 */
export function mergeStorefrontLayout(
  saved: StorefrontBentoLayoutItem[] | null | undefined,
  defaults: StorefrontBentoLayoutItem[]
): StorefrontBentoLayoutItem[] {
  const savedMap = new Map((saved ?? []).map((l) => [l.i, l]));
  return defaults.map((d) => {
    const s = savedMap.get(d.i);
    if (!s) return { ...d };
    return {
      ...d,
      x: s.x,
      y: s.y,
      w: Math.min(Math.max(s.w, d.minW ?? 1), d.maxW ?? STOREFRONT_BENTO_COLS),
      h: Math.min(Math.max(s.h, d.minH ?? 1), d.maxH ?? 8),
      minW: d.minW,
      minH: d.minH,
      maxW: d.maxW,
      maxH: d.maxH,
    };
  });
}

/** Ordre d’affichage mobile : tri par (y, x) sur la grille desktop. */
export function mobileTileOrder(layout: StorefrontBentoLayoutItem[]): string[] {
  return [...layout]
    .sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x))
    .map((l) => l.i);
}

function collides(a: StorefrontBentoLayoutItem, b: StorefrontBentoLayoutItem): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function canPlaceAt(
  item: StorefrontBentoLayoutItem,
  placed: StorefrontBentoLayoutItem[],
  nextX: number,
  nextY: number
): boolean {
  if (nextX < 0 || nextX + item.w > STOREFRONT_BENTO_COLS || nextY < 0) return false;
  const candidate = { ...item, x: nextX, y: nextY };
  for (const existing of placed) {
    if (collides(candidate, existing)) return false;
  }
  return true;
}

/**
 * Compaction verticale stable (sans collision) en conservant au mieux l’ordre visuel.
 * Le tri se base sur y puis x puis ordre d’origine, puis chaque tuile remonte au plus haut.
 */
export function compactStorefrontLayout(
  layout: StorefrontBentoLayoutItem[]
): StorefrontBentoLayoutItem[] {
  const ordered = [...layout]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      if (a.item.y !== b.item.y) return a.item.y - b.item.y;
      if (a.item.x !== b.item.x) return a.item.x - b.item.x;
      return a.idx - b.idx;
    });

  const placed: StorefrontBentoLayoutItem[] = [];

  for (const { item } of ordered) {
    const clampedWidth = Math.min(Math.max(item.w, item.minW ?? 1), item.maxW ?? STOREFRONT_BENTO_COLS);
    const nextItem: StorefrontBentoLayoutItem = { ...item, w: clampedWidth };
    const maxStartX = STOREFRONT_BENTO_COLS - nextItem.w;
    let found = false;

    for (let y = 0; y <= nextItem.y; y++) {
      for (let x = 0; x <= maxStartX; x++) {
        if (canPlaceAt(nextItem, placed, x, y)) {
          placed.push({ ...nextItem, x, y });
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      let y = Math.max(0, nextItem.y);
      while (!found) {
        for (let x = 0; x <= maxStartX; x++) {
          if (canPlaceAt(nextItem, placed, x, y)) {
            placed.push({ ...nextItem, x, y });
            found = true;
            break;
          }
        }
        y += 1;
      }
    }
  }

  return placed;
}
