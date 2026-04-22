"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ensureDefaultShopForOwner } from "@/lib/merchant-bootstrap";
import { merchantPasswordSchema } from "@/lib/auth/merchantPasswordSchema";
import { usernameSchema } from "@/lib/auth/usernameSchema";
import { useLocale } from "@/components/i18n/LocaleProvider";

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "dashboard.account.validation.fullNameMin"),
  username: usernameSchema,
  email: z.string().trim().email("dashboard.account.validation.emailInvalid"),
  password: merchantPasswordSchema,
});

type RegisterValues = z.infer<typeof registerSchema>;

function translateUsernameZodCode(
  code: string | undefined,
  t: (key: string, fallback?: string) => string
): string {
  switch (code) {
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
      return code ?? "";
  }
}

function mapAuthError(message: string): string {
  if (
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "If this address is valid, you will receive a confirmation email.";
  }
  if (message.includes("Password should be at least")) {
    return "Your password must contain at least 10 characters.";
  }
  if (message.includes("weak") || message.includes("too short")) {
    return "Add uppercase letters, numbers, or special characters to strengthen your password.";
  }
  return "An error occurred, please try again.";
}

export function RegisterForm() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [isQuickLoading, setIsQuickLoading] = useState(false);

  async function handleQuickAccount() {
    setIsQuickLoading(true);
    setServerError(null);
    try {
      const res = await fetch("/api/dev/quick-account", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        shopId?: string;
      };
      if (!res.ok) {
        const detail =
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : res.status === 404
              ? "Shortcut unavailable (environment or configuration)."
              : `Server error (${res.status}).`;
        setServerError(`Error: ${detail}`);
        return;
      }
      router.push(`/onboarding/shop?shopId=${data.shopId}`);
      router.refresh();
    } catch {
      setServerError(locale === "en" ? "Unexpected error." : "Unexpected error.");
    } finally {
      setIsQuickLoading(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterValues) {
    setServerError(null);
    setAwaitingConfirmation(false);
    const supabase = createClient();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
          username: values.username,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        console.error("[register] signUp failed", {
          error: data.error,
          code: data.code,
          timestamp: new Date().toISOString(),
        });
        if (data.code === "username_taken") {
          setServerError(t("dashboard.register.usernameTaken"));
          return;
        }
        if (data.code === "validation_error" && typeof data.error === "string") {
          setServerError(
            data.error.startsWith("ERR_USERNAME_")
              ? translateUsernameZodCode(data.error, t)
              : data.error.startsWith("dashboard.")
                ? t(data.error, data.error)
                : data.error
          );
          return;
        }
        setServerError(mapAuthError(data.error ?? ""));
        return;
      }

      const { userId, hasSession } = await res.json();

      if (!userId) {
        setServerError(
          locale === "en"
            ? "An unexpected error occurred."
            : "An unexpected error occurred."
        );
        return;
      }

      if (!hasSession) {
        setAwaitingConfirmation(true);
        return;
      }

      const shopResult = await ensureDefaultShopForOwner(
        supabase,
        userId,
        values.full_name
      );

      if (!shopResult.ok) {
        console.error("[register] shop creation failed", {
          userId,
          error: shopResult.error,
          timestamp: new Date().toISOString(),
        });
        await fetch("/api/auth/rollback", { method: "POST" });
        await supabase.auth.signOut();
        setServerError(
          locale === "en"
            ? "Account creation failed. Please try again."
            : "Account creation failed. Please try again."
        );
        return;
      }

      router.push(`/onboarding/shop?shopId=${shopResult.shopId}`);
      router.refresh();
    } catch {
      setServerError(
        locale === "en"
          ? "An unexpected error occurred. Please try again."
          : "An unexpected error occurred. Please try again."
      );
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium text-foreground">
          Bento Resto has sent you a confirmation email.
        </p>
        <p className="text-sm text-muted-foreground">
          Open the message and follow the link: your account will be activated and
          you will be signed in to configure your storefront (onboarding step).
        </p>
        <p className="text-xs text-muted-foreground">
          Nothing in your inbox? Check spam or the Promotions tab.
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Marie Dupont"
          autoComplete="name"
          disabled={isSubmitting}
          {...register("full_name")}
          aria-invalid={!!errors.full_name}
        />
        {errors.full_name?.message ? (
          <p className="text-sm text-destructive">{t(errors.full_name.message, errors.full_name.message)}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">{t("dashboard.register.usernameLabel")}</Label>
        <Input
          id="username"
          type="text"
          placeholder={t("dashboard.register.usernamePlaceholder")}
          autoComplete="username"
          disabled={isSubmitting}
          {...register("username")}
          aria-invalid={!!errors.username}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.register.usernameHint")}</p>
        {errors.username?.message ? (
          <p className="text-sm text-destructive">
            {translateUsernameZodCode(String(errors.username.message), t)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email?.message ? (
          <p className="text-sm text-destructive">{t(errors.email.message, errors.email.message)}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password?.message ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
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
            Creating account...
          </>
        ) : (
          "Create my account"
        )}
      </Button>

      {process.env.NODE_ENV === "development" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed opacity-40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground/60">
                dev only
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
            onClick={handleQuickAccount}
            disabled={isQuickLoading || isSubmitting}
          >
            {isQuickLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                1-click test account
              </>
            )}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
