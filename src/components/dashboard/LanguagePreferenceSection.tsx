"use client";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LanguagePreferenceSection() {
  const { t } = useLocale();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("dashboard.settings.languageDescription", "Choose the interface language.")}
      </p>
      <LocaleSwitcher />
    </div>
  );
}
