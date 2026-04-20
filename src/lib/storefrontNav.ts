/** Émis au clic sur le logo vitrine pour revenir à la grille des catégories sans rechargement. */
export const STOREFRONT_NAVIGATE_HOME = "bento:storefront-home" as const;

export function dispatchStorefrontNavigateHome() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STOREFRONT_NAVIGATE_HOME));
}
