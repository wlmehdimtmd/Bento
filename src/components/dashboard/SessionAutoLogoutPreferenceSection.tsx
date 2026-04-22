"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";

const TIMEOUT_OPTIONS_MINUTES = [5, 10, 15, 30, 60] as const;
const DEFAULT_TIMEOUT_MINUTES = 15;

interface SessionAutoLogoutPreferenceSectionProps {
  userId: string;
  initialDisableAutoLogout: boolean;
  initialAutoLogoutTimeoutMinutes: number;
  featureAvailable?: boolean;
}

export function SessionAutoLogoutPreferenceSection({
  userId,
  initialDisableAutoLogout,
  initialAutoLogoutTimeoutMinutes,
  featureAvailable = true,
}: SessionAutoLogoutPreferenceSectionProps) {
  const { t } = useLocale();
  const [disableAutoLogout, setDisableAutoLogout] = useState(initialDisableAutoLogout);
  const [timeoutMinutes, setTimeoutMinutes] = useState(
    TIMEOUT_OPTIONS_MINUTES.includes(initialAutoLogoutTimeoutMinutes as (typeof TIMEOUT_OPTIONS_MINUTES)[number])
      ? initialAutoLogoutTimeoutMinutes
      : DEFAULT_TIMEOUT_MINUTES
  );
  const [isSaving, setIsSaving] = useState(false);

  const timeoutLabel = useMemo(
    () =>
      t(
        "dashboard.settings.session.timeoutMinutesLabel",
        `${timeoutMinutes} minutes`
      ).replace("{minutes}", String(timeoutMinutes)),
    [t, timeoutMinutes]
  );

  async function persist(nextDisableAutoLogout: boolean, nextTimeoutMinutes: number) {
    if (!featureAvailable) {
      toast.error(
        t(
          "dashboard.settings.session.migrationRequired",
          "Fonction indisponible tant que la migration base de donnees n'est pas appliquee."
        )
      );
      return false;
    }

    const supabase = createClient();
    setIsSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        disable_auto_logout: nextDisableAutoLogout,
        auto_logout_timeout_minutes: nextTimeoutMinutes,
      })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      console.error("[session-auto-logout] failed to update user preferences", error);
      const looksLikeMissingColumn =
        typeof error.message === "string" &&
        (error.message.includes("disable_auto_logout") ||
          error.message.includes("auto_logout_timeout_minutes") ||
          error.message.toLowerCase().includes("column"));
      toast.error(
        looksLikeMissingColumn
          ? t(
              "dashboard.settings.session.migrationRequired",
              "Fonction indisponible tant que la migration base de donnees n'est pas appliquee."
            )
          : t(
              "dashboard.settings.session.saveError",
              "Impossible d'enregistrer les préférences de session."
            )
      );
      return false;
    }

    toast.success(
      t(
        "dashboard.settings.session.saveSuccess",
        "Préférences de session enregistrées."
      )
    );
    return true;
  }

  async function handleSwitchChange(nextChecked: boolean) {
    const previous = disableAutoLogout;
    setDisableAutoLogout(nextChecked);
    const ok = await persist(nextChecked, timeoutMinutes);
    if (!ok) setDisableAutoLogout(previous);
  }

  async function updateTimeoutPreference(nextValue: string) {
    const parsed = Number(nextValue);
    if (!TIMEOUT_OPTIONS_MINUTES.includes(parsed as (typeof TIMEOUT_OPTIONS_MINUTES)[number])) return;

    const previous = timeoutMinutes;
    setTimeoutMinutes(parsed);
    const ok = await persist(disableAutoLogout, parsed);
    if (!ok) setTimeoutMinutes(previous);
  }

  function handleTimeoutChange(nextValue: string | null) {
    if (nextValue === null) return;
    void updateTimeoutPreference(nextValue);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="disable-auto-logout" className="text-base">
              {t(
                "dashboard.settings.session.disableLabel",
                "Ne jamais déconnecter automatiquement"
              )}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t(
                "dashboard.settings.session.disableDescription",
                "Recommandé quand l'interface reste ouverte pour prendre des commandes."
              )}
            </p>
          </div>
          <Switch
            id="disable-auto-logout"
            checked={disableAutoLogout}
            onCheckedChange={handleSwitchChange}
            disabled={isSaving || !featureAvailable}
            aria-label={t(
              "dashboard.settings.session.disableAriaLabel",
              "Désactiver la déconnexion automatique"
            )}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-4">
        <Label htmlFor="auto-logout-timeout-select" className="text-sm font-medium">
          {t("dashboard.settings.session.timeoutLabel", "Délai d'inactivité avant déconnexion")}
        </Label>
        <Select
          value={String(timeoutMinutes)}
          onValueChange={handleTimeoutChange}
          disabled={disableAutoLogout || isSaving || !featureAvailable}
        >
          <SelectTrigger id="auto-logout-timeout-select" className="w-full sm:w-[240px]">
            <SelectValue placeholder={timeoutLabel} />
          </SelectTrigger>
          <SelectContent>
            {TIMEOUT_OPTIONS_MINUTES.map((minutes) => (
              <SelectItem key={minutes} value={String(minutes)}>
                {t("dashboard.settings.session.timeoutOptionMinutes", "{minutes} min").replace(
                  "{minutes}",
                  String(minutes)
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {!featureAvailable
            ? t(
                "dashboard.settings.session.migrationRequired",
                "Fonction indisponible tant que la migration base de donnees n'est pas appliquee."
              )
            : disableAutoLogout
            ? t(
                "dashboard.settings.session.timeoutDisabledHint",
                "Le délai est ignoré tant que la déconnexion automatique est désactivée."
              )
            : t(
                "dashboard.settings.session.timeoutEnabledHint",
                "Déconnexion automatique après {minutes} minutes sans activité."
              ).replace("{minutes}", String(timeoutMinutes))}
        </p>
      </div>

      {isSaving ? (
        <p className="inline-flex items-center text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          {t("dashboard.common.saving", "Enregistrement…")}
        </p>
      ) : null}
    </div>
  );
}
