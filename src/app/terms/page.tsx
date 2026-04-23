import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

export default async function TermsPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const isEn = locale === "en";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">
        {isEn ? "Terms of Service" : "Conditions d'utilisation"}
      </h1>
      <p className="text-muted-foreground">
        {isEn
          ? "Bento Resto provides a SaaS platform for storefront management and online ordering."
          : "Bento Resto fournit une plateforme SaaS de gestion de vitrine et de commande en ligne."}
      </p>
      <p className="text-muted-foreground">
        {isEn
          ? "Using the service implies acceptance of applicable subscription, billing, and usage rules."
          : "L'utilisation du service implique l'acceptation des conditions d'abonnement, de facturation et d'usage applicables."}
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {isEn ? "Commercial terms (pricing, billing, liability caps) are set out in the " : "Les conditions commerciales (tarifs, facturation, plafonds de responsabilité) figurent dans les "}
        <Link href="/cgv" className="text-foreground underline underline-offset-4 hover:text-primary">
          {isEn ? "General Terms of Sale" : "conditions générales de vente (CGV)"}
        </Link>
        .
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {isEn ? "Cookie usage and consent management are described in the " : "L'utilisation des cookies et la gestion du consentement sont decrites dans la "}
        <Link href="/cookies" className="text-foreground underline underline-offset-4 hover:text-primary">
          {isEn ? "Cookie Policy" : "politique cookies"}
        </Link>
        .
      </p>
      <CookiePreferencesButton className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent transition-colors" />
    </main>
  );
}
