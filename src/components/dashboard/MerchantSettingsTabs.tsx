"use client";

import { AccountSettingsSection } from "@/components/dashboard/AccountSettingsSection";
import { LanguagePreferenceSection } from "@/components/dashboard/LanguagePreferenceSection";
import { SessionAutoLogoutPreferenceSection } from "@/components/dashboard/SessionAutoLogoutPreferenceSection";
import { ThemePreferenceSection } from "@/components/dashboard/ThemePreferenceSection";
import { DeleteAccountButton } from "@/components/dashboard/DeleteAccountButton";
import { ResetShopButton } from "@/components/shop/ResetShopButton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/components/i18n/LocaleProvider";

export interface MerchantSettingsTabsProps {
  userId: string;
  authEmail: string;
  initialFullName: string;
  initialUsername: string;
  initialDisableAutoLogout: boolean;
  initialAutoLogoutTimeoutMinutes: number;
  sessionFeatureAvailable: boolean;
  firstShop: { name: string } | null;
}

export function MerchantSettingsTabs({
  userId,
  authEmail,
  initialFullName,
  initialUsername,
  initialDisableAutoLogout,
  initialAutoLogoutTimeoutMinutes,
  sessionFeatureAvailable,
  firstShop,
}: MerchantSettingsTabsProps) {
  const { t } = useLocale();

  return (
    <Tabs defaultValue="account" className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <TabsList
          variant="segmented"
          className="inline-flex h-11 min-h-11 w-max min-w-full max-w-none flex-nowrap items-stretch justify-start gap-1 sm:w-full sm:justify-between"
        >
          <TabsTrigger
            value="account"
            className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1"
          >
            {t("dashboard.settings.tabs.account", "Compte")}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1"
          >
            {t("dashboard.settings.tabs.preferences", "Préférences")}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1"
          >
            {t("dashboard.settings.tabs.security", "Sécurité")}
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="h-full shrink-0 grow-0 basis-auto whitespace-nowrap sm:flex-1"
          >
            {t("dashboard.settings.tabs.advanced", "Avancé")}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="account" keepMounted className="min-h-0 flex-1 pt-1 outline-none">
        <AccountSettingsSection
          userId={userId}
          authEmail={authEmail}
          initialFullName={initialFullName}
          initialUsername={initialUsername}
        />
      </TabsContent>

      <TabsContent value="preferences" keepMounted className="min-h-0 flex-1 space-y-10 pt-1 outline-none">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
            {t("dashboard.settings.languageTitle", "Langue")}
          </h2>
          <LanguagePreferenceSection />
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
            {t("dashboard.settings.appearanceTitle", "Apparence")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.settings.appearanceDescription", "Merchant area theme")}
          </p>
          <ThemePreferenceSection />
        </div>
      </TabsContent>

      <TabsContent value="security" keepMounted className="min-h-0 flex-1 space-y-4 pt-1 outline-none">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
          {t("dashboard.settings.session.title", "Session et sécurité")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "dashboard.settings.session.description",
            "Définissez après combien de temps d'inactivité l'interface se déconnecte automatiquement."
          )}
        </p>
        <SessionAutoLogoutPreferenceSection
          userId={userId}
          initialDisableAutoLogout={initialDisableAutoLogout}
          initialAutoLogoutTimeoutMinutes={initialAutoLogoutTimeoutMinutes}
          featureAvailable={sessionFeatureAvailable}
        />
      </TabsContent>

      <TabsContent value="advanced" keepMounted className="min-h-0 flex-1 space-y-10 pt-1 outline-none">
        {firstShop ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-destructive" style={{ fontFamily: "var(--font-onest)" }}>
              {t("dashboard.settings.dangerTitle", "Danger zone")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.settings.dangerDescriptionPrefix", "Fully resets the shop")}{" "}
              <strong className="text-foreground">{firstShop.name}</strong>
              {t(
                "dashboard.settings.dangerDescriptionSuffix",
                ": all categories will be deleted."
              )}
            </p>
            <ResetShopButton shopName={firstShop.name} />
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
              {t("dashboard.settings.advancedEmptyTitle", "Aucune action avancée")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "dashboard.settings.advancedEmptyDescription",
                "La réinitialisation de boutique apparaîtra ici une fois votre commerce créé."
              )}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-destructive" style={{ fontFamily: "var(--font-onest)" }}>
            {t("dashboard.settings.deleteAccount.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.settings.deleteAccount.subtitle")}</p>
          <DeleteAccountButton authEmail={authEmail} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
