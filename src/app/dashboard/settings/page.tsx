import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MerchantSettingsTabs } from "@/components/dashboard/MerchantSettingsTabs";
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
    .select("disable_auto_logout, auto_logout_timeout_minutes, full_name, username, email")
    .eq("id", user.id)
    .maybeSingle();

  const initialDisableAutoLogout = userPreferences?.disable_auto_logout ?? false;
  const initialAutoLogoutTimeoutMinutes = userPreferences?.auto_logout_timeout_minutes ?? 15;

  const profileFullName =
    (userPreferences?.full_name as string | null | undefined)?.trim() ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "") ||
    "";
  const profileUsername =
    (userPreferences?.username as string | null | undefined)?.trim() ||
    (typeof user.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "") ||
    "";

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <h1
        className="text-3xl font-bold"
        style={{ fontFamily: "var(--font-onest)" }}
      >
        {t("dashboard.settings.title", "Settings")}
      </h1>

      <MerchantSettingsTabs
        userId={user.id}
        authEmail={user.email ?? (userPreferences?.email as string) ?? ""}
        initialFullName={profileFullName}
        initialUsername={profileUsername}
        initialDisableAutoLogout={initialDisableAutoLogout}
        initialAutoLogoutTimeoutMinutes={initialAutoLogoutTimeoutMinutes}
        sessionFeatureAvailable={!userPreferencesError}
        firstShop={firstShop ? { name: firstShop.name as string } : null}
      />
    </div>
  );
}
