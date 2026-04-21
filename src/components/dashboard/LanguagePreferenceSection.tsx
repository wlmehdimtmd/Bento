"use client";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export function LanguagePreferenceSection() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choisissez la langue de l&apos;interface.
      </p>
      <LocaleSwitcher />
    </div>
  );
}
