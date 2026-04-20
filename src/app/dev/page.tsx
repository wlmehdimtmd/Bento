import { notFound } from "next/navigation";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] Hub — Bento Resto" };

const LINKS = [
  { href: "/dev/ui", label: "Playground UI" },
  { href: "/dev/da", label: "Charte / DA" },
  { href: "/dev/onboarding", label: "Onboarding dev" },
] as const;

export default function DevHubPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Développement
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pages outils — environnement local uniquement.
          </p>
        </header>
        <nav className="flex flex-col gap-2">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-center",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
