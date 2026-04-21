/**
 * Langues éditables dans le dashboard catalogue (indépendant de `AppLocale` vitrine).
 * Activer `persisted: true` + ajouter colonnes / JSONB avant d’exposer l’onglet en prod.
 */
export type CatalogLanguageDef = {
  readonly code: string;
  /** Texte court dans l’onglet (ex. ISO majuscules). */
  readonly tabLabel: string;
  /** Nom complet pour aria-label / tooltip. */
  readonly fullName: string;
  readonly isDefault: boolean;
  /** Si false : pas d’onglet éditable tant que le stockage n’existe pas. */
  readonly persisted: boolean;
};

export const ALL_CATALOG_LANGUAGE_DEFS = [
  { code: "fr", tabLabel: "FR", fullName: "Français", isDefault: true, persisted: true },
  { code: "en", tabLabel: "EN", fullName: "English", isDefault: false, persisted: true },
  { code: "es", tabLabel: "ES", fullName: "Español", isDefault: false, persisted: false },
  { code: "de", tabLabel: "DE", fullName: "Deutsch", isDefault: false, persisted: false },
  { code: "it", tabLabel: "IT", fullName: "Italiano", isDefault: false, persisted: false },
] as const satisfies readonly CatalogLanguageDef[];

export type AnyCatalogLanguageCode = (typeof ALL_CATALOG_LANGUAGE_DEFS)[number]["code"];

export function getPersistedCatalogLanguages(): CatalogLanguageDef[] {
  return ALL_CATALOG_LANGUAGE_DEFS.filter((d) => d.persisted);
}

export function getDefaultCatalogLanguageCode(): string {
  const d = ALL_CATALOG_LANGUAGE_DEFS.find((x) => x.isDefault);
  return d?.code ?? "fr";
}

/** Codes réellement persistés en base (pour compteur X/Y et validation). */
export function getPersistedLanguageCodes(): string[] {
  return getPersistedCatalogLanguages().map((l) => l.code);
}

export type TabCompletionStatus = "empty" | "partial" | "complete" | "invalid";
