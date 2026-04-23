"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as CookieConsent from "vanilla-cookieconsent";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getCookieConsentApi() {
  return window.CookieConsent ?? CookieConsent;
}

function isCookieConsentReady() {
  const cc = getCookieConsentApi();
  if (!cc?.getConfig) return false;

  try {
    const config = cc.getConfig();
    return Boolean(config?.categories);
  } catch {
    return false;
  }
}

function clearConsentCookie() {
  const name = "bento_cookie_preferences";
  // Nettoyage explicite cookie + localStorage pour forcer l'état "sans consentement".
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  window.localStorage.removeItem(name);
}

function invalidateConsentAndShowBanner(): boolean {
  if (!isCookieConsentReady()) return false;

  const cc = getCookieConsentApi();
  clearConsentCookie();
  cc.show(true);
  return true;
}

export function DevCookiesClient() {
  const [status, setStatus] = useState("Initialisation...");
  const previousConsentRef = useRef(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = window.setInterval(() => {
      attempts += 1;

      if (!isCookieConsentReady()) {
        if (attempts >= maxAttempts) {
          setStatus("CookieConsent non pret. Recharge la page.");
          window.clearInterval(interval);
        }
        return;
      }

      invalidateConsentAndShowBanner();
      setStatus("Bandeau force et affiche.");
      window.clearInterval(interval);
    }, 200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isCookieConsentReady()) return;
      const cc = getCookieConsentApi();

      const hasConsent = cc.validConsent();
      const hadConsent = previousConsentRef.current;

      // En mode dev test: dès qu'un choix est validé, on réaffiche le bandeau.
      if (!hadConsent && hasConsent) {
        if (invalidateConsentAndShowBanner()) {
          setStatus("Choix detecte puis bandeau relance pour un nouveau test.");
        }
      }

      previousConsentRef.current = hasConsent;
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 space-y-6">
      <div>
        <Link href="/dev" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
          Retour aux pages dev
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Dev cookies</h1>
      <p className="text-muted-foreground">
        Cette page force l'affichage du bandeau cookies a chaque chargement pour faciliter les tests UX.
      </p>
      <p className="text-sm text-muted-foreground">Statut: {status}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent"
          onClick={() => {
            if (invalidateConsentAndShowBanner()) {
              setStatus("Bandeau reinitialise puis reaffiche.");
              return;
            }
            setStatus("CookieConsent non pret, attends 1 seconde puis reessaie.");
          }}
        >
          Reset + afficher bandeau
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent"
          onClick={() => {
            if (!isCookieConsentReady()) {
              setStatus("CookieConsent non pret, attends 1 seconde puis reessaie.");
              return;
            }
            const cc = getCookieConsentApi();
            cc.showPreferences();
            setStatus("Preferences ouvertes.");
          }}
        >
          Ouvrir preferences
        </button>
      </div>
    </main>
  );
}
