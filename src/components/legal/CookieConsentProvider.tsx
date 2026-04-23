"use client";

import { useEffect, useRef } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MESSAGES } from "@/lib/i18nMessages";

function getConsentTranslations() {
  return {
    fr: {
      consentModal: {
        title: MESSAGES.fr["cookies.consent.title"],
        description: MESSAGES.fr["cookies.consent.description"],
        acceptAllBtn: MESSAGES.fr["cookies.actions.acceptAll"],
        acceptNecessaryBtn: MESSAGES.fr["cookies.actions.rejectAll"],
        showPreferencesBtn: MESSAGES.fr["cookies.actions.customize"],
      },
      preferencesModal: {
        title: MESSAGES.fr["cookies.preferences.title"],
        acceptAllBtn: MESSAGES.fr["cookies.actions.acceptAll"],
        acceptNecessaryBtn: MESSAGES.fr["cookies.actions.rejectAll"],
        savePreferencesBtn: MESSAGES.fr["cookies.actions.save"],
        closeIconLabel: MESSAGES.fr["cookies.actions.close"],
        sections: [
          {
            title: MESSAGES.fr["cookies.preferences.sections.usage.title"],
            description: MESSAGES.fr["cookies.preferences.sections.usage.description"],
          },
          {
            title: MESSAGES.fr["cookies.preferences.sections.necessary.title"],
            description: MESSAGES.fr["cookies.preferences.sections.necessary.description"],
            linkedCategory: "necessary",
          },
          {
            title: MESSAGES.fr["cookies.preferences.sections.analytics.title"],
            description: MESSAGES.fr["cookies.preferences.sections.analytics.description"],
            linkedCategory: "analytics",
          },
          {
            title: MESSAGES.fr["cookies.preferences.sections.marketing.title"],
            description: MESSAGES.fr["cookies.preferences.sections.marketing.description"],
            linkedCategory: "marketing",
          },
          {
            title: MESSAGES.fr["cookies.preferences.sections.more.title"],
            description: MESSAGES.fr["cookies.preferences.sections.more.description"],
          },
        ],
      },
    },
    en: {
      consentModal: {
        title: MESSAGES.en["cookies.consent.title"],
        description: MESSAGES.en["cookies.consent.description"],
        acceptAllBtn: MESSAGES.en["cookies.actions.acceptAll"],
        acceptNecessaryBtn: MESSAGES.en["cookies.actions.rejectAll"],
        showPreferencesBtn: MESSAGES.en["cookies.actions.customize"],
      },
      preferencesModal: {
        title: MESSAGES.en["cookies.preferences.title"],
        acceptAllBtn: MESSAGES.en["cookies.actions.acceptAll"],
        acceptNecessaryBtn: MESSAGES.en["cookies.actions.rejectAll"],
        savePreferencesBtn: MESSAGES.en["cookies.actions.save"],
        closeIconLabel: MESSAGES.en["cookies.actions.close"],
        sections: [
          {
            title: MESSAGES.en["cookies.preferences.sections.usage.title"],
            description: MESSAGES.en["cookies.preferences.sections.usage.description"],
          },
          {
            title: MESSAGES.en["cookies.preferences.sections.necessary.title"],
            description: MESSAGES.en["cookies.preferences.sections.necessary.description"],
            linkedCategory: "necessary",
          },
          {
            title: MESSAGES.en["cookies.preferences.sections.analytics.title"],
            description: MESSAGES.en["cookies.preferences.sections.analytics.description"],
            linkedCategory: "analytics",
          },
          {
            title: MESSAGES.en["cookies.preferences.sections.marketing.title"],
            description: MESSAGES.en["cookies.preferences.sections.marketing.description"],
            linkedCategory: "marketing",
          },
          {
            title: MESSAGES.en["cookies.preferences.sections.more.title"],
            description: MESSAGES.en["cookies.preferences.sections.more.description"],
          },
        ],
      },
    },
  };
}

export function CookieConsentProvider() {
  const { locale } = useLocale();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      void CookieConsent.setLanguage(locale, true);
      return;
    }

    initializedRef.current = true;

    void CookieConsent.run({
      mode: "opt-in",
      manageScriptTags: true,
      autoClearCookies: true,
      hideFromBots: true,
      cookie: {
        name: "bento_cookie_preferences",
        sameSite: "Lax",
        expiresAfterDays: 182,
      },
      guiOptions: {
        consentModal: {
          layout: "box",
          position: "bottom right",
          equalWeightButtons: true,
        },
        preferencesModal: {
          layout: "box",
          equalWeightButtons: true,
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          autoClear: {
            cookies: [{ name: /^_ga/ }, { name: "_gid" }, { name: "_gat" }],
          },
        },
        marketing: {
          autoClear: {
            cookies: [{ name: /^_fbp/ }, { name: /^fr/ }],
          },
        },
      },
      language: {
        default: locale,
        translations: getConsentTranslations(),
      },
    });
  }, [locale]);

  return null;
}
