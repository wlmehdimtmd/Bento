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
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(10, "Au moins 10 caractères")
    .regex(/[A-Z]/, "Au moins une lettre majuscule")
    .regex(/[a-z]/, "Au moins une lettre minuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial (!@#$%…)"),
});

type RegisterValues = z.infer<typeof registerSchema>;

function mapAuthError(message: string): string {
  if (
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    // Ne pas révéler si l'email est déjà pris — message identique au cas succès
    return "Si cette adresse est valide, vous recevrez un email de confirmation.";
  }
  if (message.includes("Password should be at least")) {
    return "Votre mot de passe doit contenir au moins 10 caractères.";
  }
  if (message.includes("weak") || message.includes("too short")) {
    return "Ajoutez des majuscules, chiffres ou caractères spéciaux pour renforcer votre mot de passe.";
  }
  return "Une erreur est survenue, veuillez réessayer.";
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
              ? "Raccourci indisponible (environnement ou configuration)."
              : `Erreur serveur (${res.status}).`;
        setServerError(`Erreur : ${detail}`);
        return;
      }
      router.push(`/onboarding/shop?shopId=${data.shopId}`);
      router.refresh();
    } catch {
      setServerError(locale === "en" ? "Unexpected error." : "Erreur inattendue.");
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
      // 1. Créer le compte via route serveur (logging IP + user-agent)
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
        console.error("[register] Échec signUp", {
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
            : "Une erreur inattendue s'est produite."
        );
        return;
      }

      // Si Supabase demande une confirmation email, la session est null.
      // Le mot de passe est bien persisté ; l'utilisateur doit d'abord confirmer.
      if (!hasSession) {
        setAwaitingConfirmation(true);
        return;
      }

      // 2. Créer la boutique (nécessite la session cookie posée par la route register)
      const shopResult = await ensureDefaultShopForOwner(
        supabase,
        userId,
        values.full_name
      );

      if (!shopResult.ok) {
        console.error("[register] Échec création boutique", {
          userId,
          error: shopResult.error,
          timestamp: new Date().toISOString(),
        });
        await fetch("/api/auth/rollback", { method: "POST" });
        await supabase.auth.signOut();
        setServerError(
          locale === "en"
            ? "Account creation failed. Please try again."
            : "La création de votre compte a échoué. Veuillez réessayer."
        );
        return;
      }

      router.push(`/onboarding/shop?shopId=${shopResult.shopId}`);
      router.refresh();
    } catch {
      setServerError(
        locale === "en"
          ? "An unexpected error occurred. Please try again."
          : "Une erreur inattendue s'est produite. Veuillez réessayer."
      );
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium text-foreground">
          Bento Resto vous a envoyé un email de confirmation.
        </p>
        <p className="text-sm text-muted-foreground">
          Ouvrez le message et suivez le lien : votre compte sera activé et vous
          serez connecté pour configurer votre vitrine en ligne (étape d&apos;onboarding).
        </p>
        <p className="text-xs text-muted-foreground">
          Rien dans la boîte de réception ? Vérifiez les courriers indésirables ou
          l&apos;onglet Promotions.
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nom complet</Label>
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
            Création du compte…
          </>
        ) : (
          "Créer mon compte"
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
                Création…
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Compte test en 1 clic
              </>
            )}
          </Button>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-[var(--primary)]"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
