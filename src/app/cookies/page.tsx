import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";

export default async function CookiesPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  const isEn = locale === "en";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">{isEn ? "Cookie Policy" : "Politique cookies"}</h1>

      <p className="text-muted-foreground">
        {isEn
          ? "Bento Resto uses strictly necessary cookies for authentication, security, and language preferences. Optional categories can include analytics and marketing cookies when enabled."
          : "Bento Resto utilise des cookies strictement necessaires pour l'authentification, la securite et les preferences de langue. Les categories optionnelles peuvent inclure des cookies analytiques et marketing lorsqu'ils sont actives."}
      </p>

      <p className="text-muted-foreground">
        {isEn
          ? "Your choices are stored for up to 6 months and can be changed at any time."
          : "Vos choix sont conserves pendant 6 mois maximum et peuvent etre modifies a tout moment."}
      </p>

      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-sm text-muted-foreground mb-3">
          {isEn
            ? "Open the preference center to accept, reject, or customize optional cookies."
            : "Ouvrez le centre de preferences pour accepter, refuser ou personnaliser les cookies optionnels."}
        </p>
        <CookiePreferencesButton className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {isEn ? "For data-processing details, see our " : "Pour le detail des traitements de donnees, consultez notre "}
        <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
          {isEn ? "Privacy Policy" : "politique de confidentialite"}
        </Link>
        {isEn ? " and " : " et nos "}
        <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
          {isEn ? "Terms of Service" : "conditions d'utilisation"}
        </Link>
        .
      </p>
    </main>
  );
}
