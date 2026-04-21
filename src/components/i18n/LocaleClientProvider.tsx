"use client";

import { useCallback, useState } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import type { AppLocale } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n";

export function LocaleClientProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return (
    <LocaleProvider locale={locale} setLocale={setLocale}>
      {children}
    </LocaleProvider>
  );
}
