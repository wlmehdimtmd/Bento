"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(10, "At least 10 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/[a-z]/, "At least one lowercase letter")
      .regex(/[0-9]/, "At least one number")
      .regex(/[^A-Za-z0-9]/, "At least one special character (!@#$%…)"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const waitForRecovery =
        typeof window !== "undefined" &&
        (window.location.hash.includes("type=recovery") ||
          window.location.hash.includes("access_token") ||
          new URLSearchParams(window.location.search).has("code"));

      let user: User | null = null;
      let error: AuthError | null = null;
      const maxAttempts = waitForRecovery ? 10 : 1;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const res = await supabase.auth.getUser();
        user = res.data.user;
        error = res.error;
        if (user || !waitForRecovery) break;
        await new Promise((r) => setTimeout(r, 80));
      }

      if (cancelled) return;
      if (error) {
        console.error("[reset-password] getUser:", error.message);
      }
      if (!user) {
        setBlocked(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: ResetValues) {
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        console.error("[reset-password] updateUser:", error.message);
        toast.error(
          error.message ||
            (locale === "en"
              ? "Unable to update password."
              : "Unable to update password.")
        );
        return;
      }
      toast.success(
        locale === "en"
          ? "Password updated. Redirecting..."
          : "Password updated. Redirecting..."
      );
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[reset-password] unexpected:", err);
      toast.error("An unexpected error occurred.");
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p className="text-muted-foreground">
          Session not found or link expired. Request a new link from the login page.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center")}
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("password")}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          {...register("confirm")}
          aria-invalid={!!errors.confirm}
        />
        {errors.confirm && (
          <p className="text-sm text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save password"
        )}
      </Button>
    </form>
  );
}
