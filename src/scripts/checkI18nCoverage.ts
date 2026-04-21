import { MESSAGES } from "@/lib/i18nMessages";
import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n";

const fallbackKeys = new Set(Object.keys(MESSAGES[FALLBACK_LOCALE]));

for (const locale of SUPPORTED_LOCALES) {
  if (locale === FALLBACK_LOCALE) continue;
  const keys = new Set(Object.keys(MESSAGES[locale]));
  const missing = [...fallbackKeys].filter((key) => !keys.has(key));
  if (missing.length > 0) {
    console.log(`${locale}: ${missing.length} keys missing`);
  } else {
    console.log(`${locale}: complete`);
  }
}
