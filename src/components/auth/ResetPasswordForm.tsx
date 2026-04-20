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

const resetSchema = z
  .object({
    password: z
      .string()
      .min(10, "Au moins 10 caractères")
      .regex(/[A-Z]/, "Au moins une lettre majuscule")
      .regex(/[a-z]/, "Au moins une lettre minuscule")
      .regex(/[0-9]/, "Au moins un chiffre")
      .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial (!@#$%…)"),
    confirm: z.string().min(1, "Confirmez le mot de passe"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordForm() {
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
        toast.error(error.message || "Impossible de mettre à jour le mot de passe.");
        return;
      }
      toast.success("Mot de passe mis à jour. Redirection…");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[reset-password] unexpected:", err);
      toast.error("Une erreur inattendue s'est produite.");
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="space-y-4 text-center text-sm">
        <p className="text-muted-foreground">
          Session introuvable ou lien expiré. Demandez un nouveau lien depuis la page de connexion.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex w-full justify-center")}
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nouveau mot de passe</Label>
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
        <Label htmlFor="confirm">Confirmer</Label>
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
            Enregistrement…
          </>
        ) : (
          "Enregistrer le mot de passe"
        )}
      </Button>
    </form>
  );
}
