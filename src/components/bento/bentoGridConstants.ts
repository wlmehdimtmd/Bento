/** Tokens + espacement Bento (sans `display: grid` ni `grid-cols-*`). */
export const BENTO_GRID_SURFACE_CLASS = "bento-grid gap-4 auto-rows-[14rem]";

/** Grille avec `display: grid` (démo / niveau 2 / squelettes). */
export const BENTO_GRID_BASE_CLASS = `${BENTO_GRID_SURFACE_CLASS} grid`;

/**
 * Ombre des tuiles vitrine — identique au survol des `BentoCard` interactives.
 * Sert aux aperçus sans pointer-events (ex. onboarding) pour garder le relief.
 */
export const BENTO_TILE_ELEVATION_SHADOW_CLASS =
  "shadow-[0_6px_24px_-4px_rgb(0_0_0_/_0.1)] dark:shadow-[0_8px_28px_-4px_rgb(0_0_0_/_0.5)]";

/**
 * Même ombre que {@link BENTO_TILE_ELEVATION_SHADOW_CLASS}, appliquée uniquement au hover
 * (éditeur de mise en page : pas d’ombre par défaut sur les tuiles).
 */
export const BENTO_TILE_ELEVATION_SHADOW_HOVER_CLASS =
  "shadow-none transition-shadow duration-200 hover:shadow-[0_6px_24px_-4px_rgb(0_0_0_/_0.1)] dark:hover:shadow-[0_8px_28px_-4px_rgb(0_0_0_/_0.5)]";
