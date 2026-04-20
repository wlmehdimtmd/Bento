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
import { createClient } from "@/lib/supabase/client";
import { createImplicitEmailAuthClient } from "@/lib/supabase/recoveryEmailClient";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

const forgotSchema = z.object({
  email: z.string().email("Adresse email invalide"),
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
    return "Trop de demandes d’email récemment (limite Supabase). Patientez une heure ou vérifiez Auth → Logs dans le dashboard Supabase.";
  }
  return raw;
}

export function LoginForm() {
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
          // Erreur serveur — probablement un hook Supabase qui échoue
          console.error("[login] Server error:", code, msg);
          setServerError("Erreur serveur lors de la connexion. Vérifiez la configuration du hook Supabase.");
          return;
        }

        if (
          code === "invalid_credentials" ||
          msg === "Invalid login credentials"
        ) {
          setServerError("Email ou mot de passe incorrect.");
        } else if (
          code === "email_not_confirmed" ||
          msg.includes("Email not confirmed") ||
          msg.includes("email_not_confirmed")
        ) {
          setServerError(
            "Vérifiez votre boîte mail pour confirmer votre compte avant de vous connecter."
          );
        } else {
          setServerError(`Une erreur est survenue (${code || res.status}).`);
        }
        return;
      }

      const data: LoginResponse = await res
        .json()
        .catch(() => ({ success: true, redirectTo: "/dashboard" }));
      const redirectTo = data.redirectTo === "/admin" ? "/admin" : "/dashboard";
      router.push(redirectTo);
    } catch {
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
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
          forgotPasswordToastMessage(error.message) || "Impossible d'envoyer l'email."
        );
        return;
      }
      toast.success("Si cette adresse est valide, un lien vous a été envoyé.");
      setForgotOpen(false);
      forgotForm.reset();
    } catch (err) {
      console.error("[login] forgot password:", err);
      toast.error("Une erreur inattendue s'est produite.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
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
        <Label htmlFor="password">Mot de passe</Label>
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
          Mot de passe oublié ?
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
            Connexion…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          S&apos;inscrire
        </Link>
      </p>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Nous vous enverrons un lien pour choisir un nouveau mot de passe.
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
                Annuler
              </Button>
              <Button type="submit" disabled={forgotForm.formState.isSubmitting}>
                {forgotForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  "Envoyer le lien"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
