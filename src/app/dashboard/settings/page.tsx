import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemePreferenceSection } from "@/components/dashboard/ThemePreferenceSection";
import { LanguagePreferenceSection } from "@/components/dashboard/LanguagePreferenceSection";
import { SessionAutoLogoutPreferenceSection } from "@/components/dashboard/SessionAutoLogoutPreferenceSection";
import { ResetShopButton } from "@/components/shop/ResetShopButton";
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

  const { data: userPreferences, error: userPreferencesError } = await supabase
    .from("users")
    .select("disable_auto_logout, auto_logout_timeout_minutes")
    .eq("id", user.id)
    .maybeSingle();

  const initialDisableAutoLogout = userPreferences?.disable_auto_logout ?? false;
  const initialAutoLogoutTimeoutMinutes = userPreferences?.auto_logout_timeout_minutes ?? 15;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-onest)" }}
      >
        {t("dashboard.settings.title", "Settings")}
      </h1>
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">{t("dashboard.settings.languageTitle", "Language")}</h2>
        <LanguagePreferenceSection />
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">{t("dashboard.settings.appearanceTitle", "Appearance")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.settings.appearanceDescription", "Merchant area theme")}
        </p>
        <ThemePreferenceSection />
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-semibold">
          {t("dashboard.settings.session.title", "Session et sécurité")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "dashboard.settings.session.description",
            "Définissez après combien de temps d'inactivité l'interface se déconnecte automatiquement."
          )}
        </p>
        <SessionAutoLogoutPreferenceSection
          userId={user.id}
          initialDisableAutoLogout={initialDisableAutoLogout}
          initialAutoLogoutTimeoutMinutes={initialAutoLogoutTimeoutMinutes}
          featureAvailable={!userPreferencesError}
        />
      </section>

      {firstShop ? (
        <section className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="text-lg font-semibold text-destructive">{t("dashboard.settings.dangerTitle", "Danger zone")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.settings.dangerDescriptionPrefix", "Fully resets the shop")}{" "}
            <strong>{firstShop.name as string}</strong>
            {t("dashboard.settings.dangerDescriptionSuffix", ": all categories will be deleted.")}
          </p>
          <ResetShopButton shopName={firstShop.name as string} />
        </section>
      ) : null}
    </div>
  );
}
