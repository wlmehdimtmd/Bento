import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/i18n";

export function InactivePublicStorefront({
  shopName,
  locale,
}: {
  shopName: string;
  locale: AppLocale;
}) {
  const en = locale === "en";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{shopName}</h1>
      <p className="mt-4 text-muted-foreground">
        {en
          ? "This storefront is not published yet. Customers cannot view the menu until the shop is activated."
          : "Cette vitrine n'est pas encore publique. Les clients ne peuvent pas voir la carte tant que la boutique n'est pas activée."}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        {en
          ? "If you manage this shop, sign in and turn on « Active shop » in settings (or ask your administrator)."
          : "Si vous gérez cette boutique, connectez-vous et cochez « Boutique active » dans les paramètres (ou demandez à un administrateur)."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/login" className={cn(buttonVariants({ variant: "default", size: "default" }))}>
          {en ? "Sign in" : "Connexion"}
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(buttonVariants({ variant: "outline", size: "default" }))}
        >
          {en ? "Shop settings" : "Paramètres boutique"}
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "default" }))}>
          {en ? "Home" : "Accueil"}
        </Link>
      </div>
    </div>
  );
}
