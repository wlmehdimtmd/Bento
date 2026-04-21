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
