import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export default async function SupportPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">{locale === "en" ? "Support" : "Support"}</h1>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "Need help with your shop, catalog or orders? Contact us at support@bentorest.app."
          : "Besoin d'aide avec votre boutique, votre catalogue ou vos commandes ? Contactez-nous à support@bentorest.app."}
      </p>
    </main>
  );
}
