import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { LOCALE_COOKIE_NAME, resolveLocale, type AppLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18nMessages";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return {
    title: MESSAGES[locale]["auth.login.metaTitle"],
  };
}

type SearchParams = Promise<{ error?: string }>;

function callbackErrorMessage(code: string | undefined, locale: AppLocale): string | null {
  if (!code) return null;
  const en = locale === "en";
  if (code === "shop_bootstrap_failed") {
    return en
      ? "We could not finish creating your shop. Please sign in again or contact support."
      : "La création de votre boutique n'a pas pu aboutir. Reconnectez-vous ou contactez le support.";
  }
  if (code === "auth_callback_failed") {
    return en
      ? "The sign-in link is invalid or expired. Try again from the login page."
      : "Le lien de connexion est invalide ou expiré. Réessayez depuis la page de connexion.";
  }
  return en
    ? "An error occurred during sign-in. Please try again."
    : "Une erreur s'est produite lors de la connexion. Réessayez.";
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const { error: errorCode } = await searchParams;
  const authError = callbackErrorMessage(errorCode, locale);
  const m = MESSAGES[locale];

  return (
    <div className="w-full max-w-md space-y-2">
      <Link
        href="/"
        aria-label={m["auth.login.backHomeAria"]}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-4">
            <AppBrandMark variant="auth" />
          </div>
          <CardTitle className="text-2xl">{m["auth.login.pageTitle"]}</CardTitle>
          <CardDescription>{m["auth.login.pageSubtitle"]}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {authError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {authError}
            </p>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
