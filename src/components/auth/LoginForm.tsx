"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildResetPasswordRedirectTo } from "@/lib/authRedirectUrls";
import { createImplicitEmailAuthClient } from "@/lib/supabase/recoveryEmailClient";
import { useLocale } from "@/components/i18n/LocaleProvider";

const loginSchema = z.object({
  identifier: z.string().min(1, "auth.login.identifierRequired"),
  password: z.string().min(1, "auth.login.passwordRequired"),
});

const forgotSchema = z.object({
  email: z.string().email("dashboard.account.validation.emailInvalid"),
});

type LoginValues = z.infer<typeof loginSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type LoginResponse = {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  code?: string;
};

function forgotPasswordToastMessage(
  raw: string,
  t: (key: string, fallback?: string) => string
): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return t("auth.login.forgot.toastRateLimit");
  }
  return raw;
}

export function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: values.identifier.trim(),
          password: values.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg: string = data.error ?? "";
        const code: string = data.code ?? "";

        if (res.status === 500 || res.status === 503) {
          console.error("[login] Server error:", code, msg);
          setServerError(t("auth.login.serverError503"));
          return;
        }

        if (
          code === "invalid_credentials" ||
          msg === "Invalid login credentials"
        ) {
          setServerError(t("auth.login.invalidCredentials"));
        } else if (
          code === "email_not_confirmed" ||
          msg.includes("Email not confirmed") ||
          msg.includes("email_not_confirmed")
        ) {
          setServerError(t("auth.login.emailNotConfirmed"));
        } else {
          setServerError(
            t("auth.login.genericError").replace(
              "{status}",
              String(code || res.status)
            )
          );
        }
        return;
      }

      const data: LoginResponse = await res
        .json()
        .catch(() => ({ success: true, redirectTo: "/dashboard" }));
      const redirectTo = data.redirectTo === "/admin" ? "/admin" : "/dashboard";
      router.push(redirectTo);
    } catch {
      setServerError(t("auth.login.unexpectedError"));
    }
  }

  async function onForgotSubmit(values: ForgotValues) {
    try {
      const supabase = createImplicitEmailAuthClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: buildResetPasswordRedirectTo(),
      });
      if (error) {
        console.error("[login] resetPasswordForEmail:", error.message);
        toast.error(
          forgotPasswordToastMessage(error.message, t) || t("auth.login.forgot.toastSendFailed")
        );
        return;
      }
      toast.success(t("auth.login.forgot.toastSuccess"));
      setForgotOpen(false);
      forgotForm.reset();
    } catch (err) {
      console.error("[login] forgot password:", err);
      toast.error(t("auth.login.forgot.toastUnexpectedError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="identifier">{t("auth.login.identifierLabel")}</Label>
        <Input
          id="identifier"
          type="text"
          placeholder={t("auth.login.identifierPlaceholder")}
          autoComplete="username"
          disabled={isSubmitting}
          {...register("identifier")}
          aria-invalid={!!errors.identifier}
        />
        {errors.identifier?.message ? (
          <p className="text-sm text-destructive">{t(String(errors.identifier.message))}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.login.passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t("auth.login.passwordPlaceholder")}
          autoComplete="current-password"
          disabled={isSubmitting}
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password?.message ? (
          <p className="text-sm text-destructive">{t(String(errors.password.message))}</p>
        ) : null}
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-[var(--primary)]"
          onClick={() => {
            setForgotOpen(true);
            const id = getValues("identifier")?.trim() ?? "";
            if (id.includes("@")) forgotForm.setValue("email", id);
          }}
        >
          {t("auth.login.forgotPassword")}
        </button>
      </div>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("auth.login.submitting")}
          </>
        ) : (
          t("auth.login.submit")
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.login.noAccountPrompt")}{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          {t("common.register")}
        </Link>
      </p>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.login.dialog.resetTitle")}</DialogTitle>
            <DialogDescription>{t("auth.login.dialog.resetDescription")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">{t("auth.login.dialog.emailLabel")}</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                disabled={forgotForm.formState.isSubmitting}
                {...forgotForm.register("email")}
                aria-invalid={!!forgotForm.formState.errors.email}
              />
              {forgotForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {t(String(forgotForm.formState.errors.email.message))}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotOpen(false)}
                disabled={forgotForm.formState.isSubmitting}
              >
                {t("auth.login.dialog.cancel")}
              </Button>
              <Button type="submit" disabled={forgotForm.formState.isSubmitting}>
                {forgotForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.login.dialog.sending")}
                  </>
                ) : (
                  t("auth.login.dialog.sendLink")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
