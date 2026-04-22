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
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18nMessages";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return {
    title: MESSAGES[locale]["auth.register.metaTitle"],
  };
}

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const m = MESSAGES[locale];

  return (
    <div className="w-full max-w-md space-y-2">
      <Link
        href="/"
        aria-label={m["auth.register.backHomeAria"]}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-4">
            <AppBrandMark variant="auth" />
          </div>
          <CardTitle className="text-2xl">{m["auth.register.pageTitle"]}</CardTitle>
          <CardDescription>{m["auth.register.pageSubtitle"]}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
