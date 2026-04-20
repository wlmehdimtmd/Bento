import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      {/* Bento grid illustration */}
      <div className="grid grid-cols-3 gap-2 w-40 h-32 opacity-30 pointer-events-none">
        <div className="col-span-2 rounded-xl" style={{ backgroundColor: "var(--primary)" }} />
        <div className="rounded-xl bg-muted" />
        <div className="rounded-xl bg-muted" />
        <div className="col-span-2 rounded-xl bg-muted" />
      </div>

      <div className="space-y-2">
        <p
          className="text-7xl font-black tabular-nums"
          style={{ color: "var(--primary)", fontFamily: "var(--font-onest)" }}
        >
          404
        </p>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          Page introuvable
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className={buttonVariants()}
          style={{ backgroundColor: "var(--primary)", color: "white" }}
        >
          Retour à l&apos;accueil
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
