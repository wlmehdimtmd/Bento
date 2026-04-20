"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicStoreError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Impossible de charger la vitrine
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Une erreur est survenue lors du chargement. Vérifiez votre connexion et réessayez.
        </p>
      </div>
      <button
        onClick={reset}
        className={buttonVariants()}
        style={{ backgroundColor: "var(--primary)", color: "white" }}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Réessayer
      </button>
    </div>
  );
}
