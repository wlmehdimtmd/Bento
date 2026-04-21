import Link from "next/link";
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
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
  return {
    title: locale === "en" ? "Log in — Bento Resto" : "Connexion — Bento Resto",
  };
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-2">
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-4">
            <AppBrandMark variant="auth" />
          </div>
          <CardTitle className="text-2xl">Bon retour !</CardTitle>
          <CardDescription>
            Connectez-vous pour gérer votre commerce.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
