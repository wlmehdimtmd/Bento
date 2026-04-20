"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Ref: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className={buttonVariants()}
          style={{ backgroundColor: "var(--primary)", color: "white" }}
        >
          Réessayer
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
