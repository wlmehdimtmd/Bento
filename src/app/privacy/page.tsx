import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

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
      <p className="text-muted-foreground text-sm leading-relaxed">
        {locale === "en" ? "Cookie details are available in our " : "Les details relatifs aux cookies sont disponibles dans notre "}
        <Link href="/cookies" className="text-foreground underline underline-offset-4 hover:text-primary">
          {locale === "en" ? "Cookie Policy" : "politique cookies"}
        </Link>
        .
      </p>
      <CookiePreferencesButton className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-accent transition-colors" />
    </main>
  );
}
