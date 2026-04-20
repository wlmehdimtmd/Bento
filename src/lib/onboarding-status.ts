/**
 * État « onboarding terminé » pour un shop — aligné sur `social_links._ob`
 * (posé après l’écran de succès ou « Plus tard » via `markOnboardingComplete`).
 */
export function isOnboardingComplete(socialLinks: unknown): boolean {
  if (!socialLinks || typeof socialLinks !== "object") return false;
  const o = socialLinks as Record<string, unknown>;
  return o._ob === 1;
}

/**
 * Phase vitrine (assistant shop) validée et enregistrée — `social_links._ob_vitrine`.
 * Permet de reprendre au choix catalogue sans refaire l’étape vitrine.
 */
export function isVitrineOnboardingComplete(socialLinks: unknown): boolean {
  if (!socialLinks || typeof socialLinks !== "object") return false;
  const o = socialLinks as Record<string, unknown>;
  return o._ob_vitrine === 1;
}

/** Nom auto-généré à l’inscription (`buildDefaultShopInsert` dans merchant-bootstrap). */
export function isPlaceholderShopName(name: unknown): boolean {
  return typeof name === "string" && /^.+'s Shop$/.test(name);
}

/**
 * Heuristique : l’utilisateur a personnalisé la fiche (nom + slug) hors placeholder.
 */
export function isShopProfileBasicsComplete(shop: {
  name: unknown;
  slug: unknown;
}): boolean {
  if (isPlaceholderShopName(shop.name)) return false;
  if (typeof shop.slug !== "string" || shop.slug.trim().length < 2) return false;
  return true;
}
