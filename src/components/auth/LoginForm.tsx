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
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginValues = z.infer<typeof loginSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type LoginResponse = {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  code?: string;
};

function forgotPasswordToastMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Too many email requests recently (Supabase limit). Wait one hour or check Auth -> Logs in the Supabase dashboard.";
  }
  return raw;
}

export function LoginForm() {
  const { t, locale } = useLocale();
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
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg: string = data.error ?? "";
        const code: string = data.code ?? "";

        if (res.status === 500) {
          // Server error - likely a failing Supabase hook
          console.error("[login] Server error:", code, msg);
          setServerError(
            locale === "en"
              ? "Server error during login. Check Supabase hook configuration."
              : "Server error during login. Check Supabase hook configuration."
          );
          return;
        }

        if (
          code === "invalid_credentials" ||
          msg === "Invalid login credentials"
        ) {
          setServerError("Incorrect email or password.");
        } else if (
          code === "email_not_confirmed" ||
          msg.includes("Email not confirmed") ||
          msg.includes("email_not_confirmed")
        ) {
          setServerError("Check your inbox and confirm your account before logging in.");
        } else {
          setServerError(`An error occurred (${code || res.status}).`);
        }
        return;
      }

      const data: LoginResponse = await res
        .json()
        .catch(() => ({ success: true, redirectTo: "/dashboard" }));
      const redirectTo = data.redirectTo === "/admin" ? "/admin" : "/dashboard";
      router.push(redirectTo);
    } catch {
      setServerError(
        locale === "en"
          ? "An unexpected error occurred. Please try again."
          : "An unexpected error occurred. Please try again."
      );
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
          forgotPasswordToastMessage(error.message) || "Unable to send the email."
        );
        return;
      }
      toast.success(
        locale === "en"
          ? "If this email is valid, a reset link has been sent."
          : "If this email is valid, a reset link has been sent."
      );
      setForgotOpen(false);
      forgotForm.reset();
    } catch (err) {
      console.error("[login] forgot password:", err);
      toast.error("An unexpected error occurred.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          autoComplete="current-password"
          disabled={isSubmitting}
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-[var(--primary)]"
          onClick={() => {
            setForgotOpen(true);
            const email = getValues("email");
            if (email) forgotForm.setValue("email", email);
          }}
        >
          Forgot password?
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
            {locale === "en" ? "Logging in..." : "Logging in..."}
          </>
        ) : (
          locale === "en" ? "Log in" : "Log in"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {locale === "en" ? "No account yet?" : "No account yet?"}{" "}
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
            <DialogTitle>{locale === "en" ? "Reset password" : "Reset password"}</DialogTitle>
            <DialogDescription>
              {locale === "en"
                ? "We will send you a link to choose a new password."
                : "We will send you a link to choose a new password."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={forgotForm.handleSubmit(onForgotSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
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
                  {forgotForm.formState.errors.email.message}
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
                {locale === "en" ? "Cancel" : "Cancel"}
              </Button>
              <Button type="submit" disabled={forgotForm.formState.isSubmitting}>
                {forgotForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {locale === "en" ? "Sending..." : "Sending..."}
                  </>
                ) : (
                  locale === "en" ? "Send link" : "Send link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
