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
import { useLocale } from "@/components/i18n/LocaleProvider";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[0-9]/, "At least one number")
    .regex(/[^A-Za-z0-9]/, "At least one special character (!@#$%…)"),
});

type RegisterValues = z.infer<typeof registerSchema>;

function mapAuthError(message: string): string {
  if (
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    // Do not reveal whether the email is already taken.
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
  const { locale } = useLocale();
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
      // 1. Create account through server route (IP + user-agent logging)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("[register] signUp failed", {
          error: data.error,
          timestamp: new Date().toISOString(),
        });
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

      // If Supabase requires email confirmation, session is null.
      // Password is persisted; user must confirm first.
      if (!hasSession) {
        setAwaitingConfirmation(true);
        return;
      }

      // 2. Create shop (requires session cookie set by register route)
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
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
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
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
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
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
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
