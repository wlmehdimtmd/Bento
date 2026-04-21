import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export default async function TermsPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === "en" ? "Terms of Service" : "Conditions d'utilisation"}
      </h1>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "Bento Resto provides a SaaS platform for storefront management and online ordering."
          : "Bento Resto fournit une plateforme SaaS de gestion de vitrine et de commande en ligne."}
      </p>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "Using the service implies acceptance of applicable subscription, billing, and usage rules."
          : "L'utilisation du service implique l'acceptation des conditions d'abonnement, de facturation et d'usage applicables."}
      </p>
    </main>
  );
}
