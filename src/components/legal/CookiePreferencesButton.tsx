"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

export function CookiePreferencesButton({ className }: { className?: string }) {
  const { t } = useLocale();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.CookieConsent?.showPreferences();
      }}
    >
      {t("cookies.actions.manage")}
    </button>
  );
}
