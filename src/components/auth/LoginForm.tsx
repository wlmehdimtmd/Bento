"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginValues = z.infer<typeof loginSchema>;
type LoginResponse = {
  success?: boolean;
  redirectTo?: string;
  error?: string;
  code?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
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
          className="font-medium text-foreground underline underline-offset-4 hover:text-[var(--color-bento-accent)]"
        >
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}
