export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";
export const FALLBACK_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE_NAME = "bento-locale";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: "Français",
  en: "English",
};

export function formatLocaleLinkLabel(locale: AppLocale): string {
  return `${locale.toUpperCase()}: ${LOCALE_LABELS[locale]}`;
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes((value ?? "") as AppLocale);
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  if (isAppLocale(value)) return value;
  return DEFAULT_LOCALE;
}

/** Champs catalogue alignés sur les colonnes `_fr` / `_en` / legacy en base. */
export type CatalogLocalizedStrings = {
  fr?: string | null;
  en?: string | null;
  legacy?: string | null;
};

/**
 * Résout une chaîne pour la locale vitrine : EN → en puis fr puis legacy ; FR → fr puis en puis legacy.
 */
export function pickLocalized(
  locale: AppLocale,
  opts: CatalogLocalizedStrings
): string | null {
  if (locale === "en") return opts.en ?? opts.fr ?? opts.legacy ?? null;
  return opts.fr ?? opts.en ?? opts.legacy ?? null;
}
