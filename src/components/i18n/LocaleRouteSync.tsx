"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { AppLocale } from "@/lib/i18n";

export function LocaleRouteSync({ locale }: { locale: AppLocale }) {
  const { locale: currentLocale, setLocale } = useLocale();

  useEffect(() => {
    if (currentLocale !== locale) {
      setLocale(locale);
    }
  }, [currentLocale, locale, setLocale]);

  return null;
}
