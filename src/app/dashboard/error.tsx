"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
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
          Erreur du tableau de bord
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          {error.message || "Une erreur inattendue s'est produite."}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/50">
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
          <RotateCcw className="mr-2 h-4 w-4" />
          Réessayer
        </button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
