import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemePreferenceSection } from "@/components/dashboard/ThemePreferenceSection";
import { LanguagePreferenceSection } from "@/components/dashboard/LanguagePreferenceSection";
import { ResetShopButton } from "@/components/shop/ResetShopButton";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";
import { MESSAGES } from "@/lib/i18nMessages";

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  return { title: MESSAGES[locale]["dashboard.settings.metadataTitle"] };
}

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: string, fallback: string) => MESSAGES[locale][key] ?? fallback;
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
        {t("dashboard.settings.title", "Settings")}
      </h1>
      <p className="text-muted-foreground">
        {t("dashboard.settings.subtitle", "Merchant interface preferences.")}{" "}
        <strong>{t("dashboard.settings.editStorefront", "Edit storefront")}</strong> →{" "}
        <strong>{t("dashboard.settings.storefrontSettings", "Storefront settings")}</strong>.
      </p>

      {firstShop ? (
        <p>
          <Link
            href={`/dashboard/shops/${firstShop.id}/settings`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("dashboard.settings.openSettingsFor", "Open settings for")} {firstShop.name as string}
          </Link>
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("dashboard.settings.languageTitle", "Language")}</h2>
        <Separator />
        <LanguagePreferenceSection />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("dashboard.settings.appearanceTitle", "Appearance")}</h2>
        <Separator />
        <p className="text-sm text-muted-foreground">
          {t("dashboard.settings.appearanceDescription", "Merchant area theme")}
        </p>
        <ThemePreferenceSection />
      </section>

      {firstShop ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-destructive">{t("dashboard.settings.dangerTitle", "Danger zone")}</h2>
          <Separator className="bg-destructive/20" />
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.settings.dangerDescriptionPrefix", "Fully resets the shop")}{" "}
              <strong>{firstShop.name as string}</strong>
              {t("dashboard.settings.dangerDescriptionSuffix", ": all categories will be deleted.")}
            </p>
            <ResetShopButton shopName={firstShop.name as string} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
