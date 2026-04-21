import Link from "next/link";
import { ExternalLink, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminDemoMirrorInfo = {
  name: string;
  slug: string;
  isActive: boolean;
};

interface AdminDemoBannerProps {
  appUrl: string;
  configuredDemoId: string | null;
  mirroredShop: AdminDemoMirrorInfo | null;
}

export function AdminDemoBanner({ appUrl, configuredDemoId, mirroredShop }: AdminDemoBannerProps) {
  let statusLine: string;
  let slugLine: string | null = null;
  let warningLine: string | null = null;
  let orphanLine: string | null = null;

  if (!configuredDemoId) {
    statusLine = "Démo intégrée — vitrine d'exemple (données React), sans boutique miroir.";
  } else if (mirroredShop) {
    statusLine = `Miroir actif : ${mirroredShop.name}`;
    slugLine = `/${mirroredShop.slug}`;
    if (!mirroredShop.isActive) {
      warningLine = "Cette boutique est inactive ; vérifiez le rendu sur /demo.";
    }
  } else {
    statusLine = "Miroir configuré mais boutique introuvable.";
    orphanLine = `Identifiant : ${configuredDemoId.slice(0, 8)}… — mettez à jour les paramètres démo.`;
  }

  return (
    <section
      aria-label="Démo publique /demo"
      className={cn(
        "rounded-2xl border border-amber-500/25 bg-amber-50/70 p-6 dark:border-amber-500/20 dark:bg-amber-950/25",
        "shadow-sm"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
            Démo active
          </p>
          <p className="text-sm font-medium text-foreground">{statusLine}</p>
          {slugLine ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{slugLine}</span>
            </p>
          ) : null}
          {warningLine ? (
            <p className="text-xs text-amber-900 dark:text-amber-100/90">{warningLine}</p>
          ) : null}
          {orphanLine ? <p className="text-xs text-muted-foreground">{orphanLine}</p> : null}
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href={`${appUrl}/demo`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Visiter /demo
          </Link>
          <Link
            href="/admin/demo/settings"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Settings className="h-3.5 w-3.5" aria-hidden />
            Paramètres démo
          </Link>
        </div>
      </div>
    </section>
  );
}
