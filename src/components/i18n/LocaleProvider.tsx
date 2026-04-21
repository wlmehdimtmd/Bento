"use client";

import { createContext, useContext, useMemo } from "react";
import { MESSAGES } from "@/lib/i18nMessages";
import { FALLBACK_LOCALE, type AppLocale } from "@/lib/i18n";

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  setLocale,
  children,
}: {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  children: React.ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, fallback) =>
        MESSAGES[locale][key] ?? MESSAGES[FALLBACK_LOCALE][key] ?? fallback ?? key,
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
