import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemePreferenceSection } from "@/components/dashboard/ThemePreferenceSection";
import { LanguagePreferenceSection } from "@/components/dashboard/LanguagePreferenceSection";
import { ResetShopButton } from "@/components/shop/ResetShopButton";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: firstShop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-onest)" }}
      >
        Paramètres
      </h1>
      <p className="text-muted-foreground">
        Préférences de l&apos;interface marchand. La configuration de votre vitrine (QR code, infos,
        avis) se fait dans <strong>Modifier ma vitrine</strong> → <strong>Configuration vitrine</strong>.
      </p>

      {firstShop ? (
        <p>
          <Link
            href={`/dashboard/shops/${firstShop.id}/settings`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ouvrir la configuration de {firstShop.name as string}
          </Link>
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Langue</h2>
        <Separator />
        <LanguagePreferenceSection />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Apparence</h2>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Thème de l&apos;espace marchand (clair, sombre ou selon votre appareil).
        </p>
        <ThemePreferenceSection />
      </section>

      {firstShop ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Zone dangereuse</h2>
          <Separator className="bg-destructive/20" />
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Réinitialise entièrement la boutique <strong>{firstShop.name as string}</strong> : toutes
              les catégories, produits, formules et commandes seront supprimés définitivement. Vous
              repartirez de l&apos;onboarding. (S&apos;applique à votre première boutique enregistrée.)
            </p>
            <ResetShopButton shopName={firstShop.name as string} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
