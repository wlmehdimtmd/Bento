"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { merchantPasswordSchema } from "@/lib/auth/merchantPasswordSchema";
import { usernameSchema } from "@/lib/auth/usernameSchema";
import { useLocale } from "@/components/i18n/LocaleProvider";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "ERR_FULL_NAME_MIN"),
  username: usernameSchema,
});

type ProfileValues = z.infer<typeof profileSchema>;

const emailSchema = z.object({
  newEmail: z.string().trim().email("ERR_EMAIL_INVALID"),
});

type EmailValues = z.infer<typeof emailSchema>;

const passwordChangeSchema = z
  .object({
    password: merchantPasswordSchema,
    confirm: z.string().min(1, "ERR_CONFIRM_REQUIRED"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "ERR_PASSWORD_MISMATCH",
    path: ["confirm"],
  });

type PasswordValues = z.infer<typeof passwordChangeSchema>;

function isUniqueViolation(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "23505") return true;
  const m = (err.message ?? "").toLowerCase();
  return m.includes("duplicate") || m.includes("unique");
}

export interface AccountSettingsSectionProps {
  userId: string;
  authEmail: string;
  initialFullName: string;
  initialUsername: string;
}

export function AccountSettingsSection({
  userId,
  authEmail,
  initialFullName,
  initialUsername,
}: AccountSettingsSectionProps) {
  const { t } = useLocale();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const profileDefaults = useMemo(
    () => ({ full_name: initialFullName, username: initialUsername }),
    [initialFullName, initialUsername]
  );

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults,
    values: profileDefaults,
  });

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: authEmail },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  function translateProfileError(code: string | undefined): string {
    switch (code) {
      case "ERR_FULL_NAME_MIN":
        return t("dashboard.account.validation.fullNameMin", "Le nom doit contenir au moins 2 caractères.");
      case "ERR_EMAIL_INVALID":
        return t("dashboard.account.validation.emailInvalid", "Adresse e-mail invalide.");
      case "ERR_CONFIRM_REQUIRED":
        return t("dashboard.account.validation.confirmRequired", "Confirmez le mot de passe.");
      case "ERR_PASSWORD_MISMATCH":
        return t("dashboard.account.validation.passwordMismatch", "Les mots de passe ne correspondent pas.");
      case "ERR_USERNAME_MIN":
        return t("dashboard.account.validation.usernameMin", "Le nom d’utilisateur doit contenir au moins 3 caractères.");
      case "ERR_USERNAME_MAX":
        return t("dashboard.account.validation.usernameMax", "Le nom d’utilisateur ne peut pas dépasser 32 caractères.");
      case "ERR_USERNAME_FORMAT":
        return t(
          "dashboard.account.validation.usernameFormat",
          "Lettres minuscules, chiffres et tirets bas uniquement (3 à 32 caractères, commence par une lettre ou un chiffre)."
        );
      default:
        return code ?? t("dashboard.account.error.unexpected", "Une erreur est survenue.");
    }
  }

  const profileSummary =
    initialUsername.trim().length === 0
      ? "—"
      : initialFullName.trim().length > 0
        ? `${initialFullName.trim()} · @${initialUsername.trim()}`
        : `@${initialUsername.trim()}`;

  async function onProfileSubmit(values: ProfileValues) {
    setProfileSaving(true);
    const supabase = createClient();
    try {
      const { error: dbError } = await supabase
        .from("users")
        .update({
          full_name: values.full_name.trim(),
          username: values.username,
        })
        .eq("id", userId);

      if (dbError) {
        console.error("[account-settings] profile users update:", dbError);
        if (isUniqueViolation(dbError)) {
          toast.error(
            t("dashboard.account.profile.usernameTaken", "Ce nom d’utilisateur est déjà pris.")
          );
        } else {
          toast.error(
            t("dashboard.account.profile.saveError", "Impossible d’enregistrer le profil.")
          );
        }
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: values.full_name.trim(),
          username: values.username,
        },
      });

      if (authError) {
        console.error("[account-settings] profile auth updateUser:", authError);
        toast.error(
          t("dashboard.account.profile.metadataError", "Profil enregistré, mais la session n’a pas pu être mise à jour.")
        );
        router.refresh();
        return;
      }

      toast.success(t("dashboard.account.profile.saveSuccess", "Profil enregistré."));
      setProfileOpen(false);
      router.refresh();
    } catch (e) {
      console.error("[account-settings] profile unexpected:", e);
      toast.error(t("dashboard.account.error.unexpected", "Une erreur est survenue."));
    } finally {
      setProfileSaving(false);
    }
  }

  async function onEmailSubmit(values: EmailValues) {
    const next = values.newEmail.trim().toLowerCase();
    if (next === authEmail.trim().toLowerCase()) {
      toast.message(t("dashboard.account.email.unchanged", "Aucun changement d’e-mail."));
      setEmailOpen(false);
      return;
    }

    setEmailSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) {
        console.error("[account-settings] email updateUser:", error);
        toast.error(
          error.message ||
            t("dashboard.account.email.saveError", "Impossible de demander le changement d’e-mail.")
        );
        return;
      }
      toast.success(
        t(
          "dashboard.account.email.confirmSent",
          "Si cette adresse est valide, un e-mail de confirmation vous a été envoyé."
        )
      );
      emailForm.reset({ newEmail: authEmail });
      setEmailOpen(false);
      router.refresh();
    } catch (e) {
      console.error("[account-settings] email unexpected:", e);
      toast.error(t("dashboard.account.error.unexpected", "Une erreur est survenue."));
    } finally {
      setEmailSaving(false);
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        console.error("[account-settings] password updateUser:", error);
        toast.error(
          error.message ||
            t("dashboard.account.password.saveError", "Impossible de mettre à jour le mot de passe.")
        );
        return;
      }
      toast.success(t("dashboard.account.password.saveSuccess", "Mot de passe mis à jour."));
      passwordForm.reset({ password: "", confirm: "" });
      setPasswordOpen(false);
      router.refresh();
    } catch (e) {
      console.error("[account-settings] password unexpected:", e);
      toast.error(t("dashboard.account.error.unexpected", "Une erreur est survenue."));
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
          {t("dashboard.account.title", "Compte utilisateur")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "dashboard.account.subtitle",
            "Nom affiché, identifiant de connexion, e-mail et mot de passe."
          )}
        </p>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border">
        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground">{t("dashboard.account.profile.title", "Profil")}</p>
            <p className="text-sm text-muted-foreground">{profileSummary}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.account.rowProfileHint")}</p>
          </div>
          <Button type="button" variant="outline" className="shrink-0 self-start sm:self-center" onClick={() => setProfileOpen(true)}>
            {t("dashboard.account.editProfile")}
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground">{t("dashboard.account.email.title", "E-mail")}</p>
            <p className="truncate text-sm text-muted-foreground">{authEmail}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start sm:self-center"
            onClick={() => {
              emailForm.reset({ newEmail: authEmail });
              setEmailOpen(true);
            }}
          >
            {t("dashboard.account.editEmail")}
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground">{t("dashboard.account.password.title", "Mot de passe")}</p>
            <p className="text-sm text-muted-foreground">{t("dashboard.account.rowPasswordHint")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 self-start sm:self-center"
            onClick={() => {
              passwordForm.reset({ password: "", confirm: "" });
              setPasswordOpen(true);
            }}
          >
            {t("dashboard.account.editPassword")}
          </Button>
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.account.dialog.profileTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-full-name">{t("dashboard.account.profile.fullName", "Nom")}</Label>
              <Input
                id="dialog-account-full-name"
                autoComplete="name"
                disabled={profileSaving}
                {...profileForm.register("full_name")}
                aria-invalid={!!profileForm.formState.errors.full_name}
              />
              {profileForm.formState.errors.full_name?.message ? (
                <p className="text-sm text-destructive">
                  {translateProfileError(String(profileForm.formState.errors.full_name.message))}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-username">{t("dashboard.account.profile.username", "Nom d’utilisateur")}</Label>
              <Input
                id="dialog-account-username"
                autoComplete="username"
                disabled={profileSaving}
                {...profileForm.register("username")}
                aria-invalid={!!profileForm.formState.errors.username}
              />
              <p className="text-xs text-muted-foreground">{t("dashboard.account.profile.usernameHint")}</p>
              {profileForm.formState.errors.username?.message ? (
                <p className="text-sm text-destructive">
                  {translateProfileError(String(profileForm.formState.errors.username.message))}
                </p>
              ) : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)} disabled={profileSaving}>
                {t("dashboard.account.dialog.cancel")}
              </Button>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("dashboard.common.saving", "Enregistrement…")}
                  </>
                ) : (
                  t("dashboard.account.profile.save", "Enregistrer le profil")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.account.dialog.emailTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.account.dialog.emailDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.account.email.current", "E-mail actuel :")}{" "}
              <span className="font-medium text-foreground">{authEmail}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-new-email">{t("dashboard.account.email.newLabel", "Nouvel e-mail")}</Label>
              <Input
                id="dialog-account-new-email"
                type="email"
                autoComplete="email"
                disabled={emailSaving}
                {...emailForm.register("newEmail")}
                aria-invalid={!!emailForm.formState.errors.newEmail}
              />
              {emailForm.formState.errors.newEmail?.message ? (
                <p className="text-sm text-destructive">
                  {translateProfileError(String(emailForm.formState.errors.newEmail.message))}
                </p>
              ) : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEmailOpen(false)} disabled={emailSaving}>
                {t("dashboard.account.dialog.cancel")}
              </Button>
              <Button type="submit" disabled={emailSaving}>
                {emailSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("dashboard.common.saving", "Enregistrement…")}
                  </>
                ) : (
                  t("dashboard.account.email.save", "Demander le changement d’e-mail")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dashboard.account.dialog.passwordTitle")}</DialogTitle>
            <DialogDescription>{t("dashboard.account.dialog.passwordDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-new-password">{t("dashboard.account.password.newLabel", "Nouveau mot de passe")}</Label>
              <Input
                id="dialog-account-new-password"
                type="password"
                autoComplete="new-password"
                disabled={passwordSaving}
                {...passwordForm.register("password")}
                aria-invalid={!!passwordForm.formState.errors.password}
              />
              {passwordForm.formState.errors.password?.message ? (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dialog-account-confirm-password">{t("dashboard.account.password.confirmLabel", "Confirmer")}</Label>
              <Input
                id="dialog-account-confirm-password"
                type="password"
                autoComplete="new-password"
                disabled={passwordSaving}
                {...passwordForm.register("confirm")}
                aria-invalid={!!passwordForm.formState.errors.confirm}
              />
              {passwordForm.formState.errors.confirm?.message ? (
                <p className="text-sm text-destructive">
                  {translateProfileError(String(passwordForm.formState.errors.confirm.message))}
                </p>
              ) : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)} disabled={passwordSaving}>
                {t("dashboard.account.dialog.cancel")}
              </Button>
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("dashboard.common.saving", "Enregistrement…")}
                  </>
                ) : (
                  t("dashboard.account.password.save", "Mettre à jour le mot de passe")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
