import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export default async function LegalPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === "en" ? "Legal Notice" : "Mentions légales"}
      </h1>
      <p className="text-muted-foreground">
        {locale === "en"
          ? "Bento Resto is operated by Mehdi Monteyremard."
          : "Bento Resto est édité par Mehdi Monteyremard."}
      </p>
    </main>
  );
}
