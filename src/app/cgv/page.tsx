import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale, type AppLocale } from "@/lib/i18n";
import {
  bentoCgvArticles,
  BENTO_CGV_EFFECTIVE_DATE_EN,
  BENTO_CGV_EFFECTIVE_DATE_FR,
} from "@/lib/legal/bentoCgvArticles";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  return {
    title: locale === "en" ? "Terms of Sale" : "Conditions générales de vente",
    description:
      locale === "en"
        ? "General terms of sale for the Bento Resto SaaS platform."
        : "Conditions générales de vente de la plateforme SaaS Bento Resto.",
  };
}

function renderInlineBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));
}

export default async function CgvPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value) as AppLocale;
  const isEn = locale === "en";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 space-y-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {isEn ? "Effective date: " : "Version en vigueur au "}
          {isEn ? BENTO_CGV_EFFECTIVE_DATE_EN : BENTO_CGV_EFFECTIVE_DATE_FR}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEn ? "General Terms of Sale" : "Conditions générales de vente"}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isEn
            ? "These terms govern the commercial relationship for the Bento Resto software service. They complement the "
            : "Les présentes conditions encadrent la relation commerciale relative au service logiciel Bento Resto. Elles complètent les "}
          <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
            {isEn ? "Terms of Service" : "conditions d'utilisation (CGU)"}
          </Link>
          {isEn ? " and the " : " et la "}
          <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
            {isEn ? "Privacy Policy" : "politique de confidentialité"}
          </Link>
          .
        </p>
      </div>

      <div className="space-y-8">
        {bentoCgvArticles.map((art) => (
          <section key={art.id} className="space-y-3" aria-labelledby={`cgv-${art.id}`}>
            <h2 id={`cgv-${art.id}`} className="text-xl font-semibold tracking-tight scroll-mt-24">
              {isEn ? art.title.en : art.title.fr}
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              {(isEn ? art.paragraphs.en : art.paragraphs.fr).map((p, idx) => (
                <p key={idx}>{renderInlineBold(p)}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
