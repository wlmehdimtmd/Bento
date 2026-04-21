import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export default async function PrivacyPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === "en" ? "Privacy Policy" : "Politique de confidentialité"}
      </h1>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "We process account and order data to operate Bento Resto services and support merchants."
          : "Nous traitons les données de compte et de commande pour opérer les services Bento Resto et assister les commerçants."}
      </p>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "For any request related to your personal data, contact support."
          : "Pour toute demande liée à vos données personnelles, contactez le support."}
      </p>
    </main>
  );
}
