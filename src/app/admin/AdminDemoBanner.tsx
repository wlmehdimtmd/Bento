import Link from "next/link";
import { ExternalLink, FlaskConical, LayoutGrid, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_TEMPLATE_SHOP_SLUG } from "@/lib/demoTemplateShop";

type DemoShop = { id: string; name: string; slug: string } | null;

type Owner = { email: string; full_name: string | null } | null;

interface AdminDemoBannerProps {
  demoShop: DemoShop;
  demoOwner: Owner;
  configuredDemoId: string | null;
  appUrl: string;
}

export function AdminDemoBanner({
  demoShop,
  demoOwner,
  configuredDemoId,
  appUrl,
}: AdminDemoBannerProps) {
  const demoModeLabel = !demoShop
    ? "Démo intégrée"
    : !configuredDemoId && demoShop.slug === DEMO_TEMPLATE_SHOP_SLUG
      ? "Démo modèle"
      : "Démo miroir";

  return (
    <section
      className={cn(
        "rounded-2xl border border-amber-500/25 bg-amber-50/70 p-6 dark:border-amber-500/20 dark:bg-amber-950/25",
        "shadow-sm"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
              Vitrine publique <span className="font-mono text-base">/demo</span>
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              Maison Kanpai
            </span>
            <span className="rounded-full border border-amber-600/30 bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
              {demoModeLabel}
            </span>
          </div>

          {demoShop ? (
            <p className="text-sm text-muted-foreground">
              Contenu affiché sur <span className="font-mono text-foreground">/demo</span> :{" "}
              <span className="font-medium text-foreground">{demoShop.name}</span>
              <span className="font-mono text-xs"> /{demoShop.slug}</span>
              {!configuredDemoId && demoShop.slug === DEMO_TEMPLATE_SHOP_SLUG ? (
                <span className="mt-2 block text-xs leading-relaxed">
                  Éditable depuis l&apos;admin : Infos, Contenu, configuration vitrine et mise en page
                  (boutons ci-dessous).
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Carte d&apos;exemple intégrée (sans boutique Supabase). Configurez une source dans les
              paramètres démo pour brancher une vitrine réelle.
            </p>
          )}

          <div className="text-xs text-muted-foreground">
            {demoShop ? (
              demoOwner ? (
                <p>
                  <span className="font-medium text-foreground">
                    {demoOwner.full_name ?? demoOwner.email}
                  </span>
                  {demoOwner.full_name ? (
                    <span className="block font-mono text-[11px]">{demoOwner.email}</span>
                  ) : null}
                </p>
              ) : (
                <p>Propriétaire : —</p>
              )
            ) : (
              <p>Source : système (pas de propriétaire boutique)</p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2 lg:justify-end">
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
          {demoShop ? (
            <>
              <Link
                href={`/admin/shops/${demoShop.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Settings className="h-3.5 w-3.5" aria-hidden />
                Infos
              </Link>
              <Link
                href={`/admin/shops/${demoShop.id}/manage`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                Contenu
              </Link>
              <Link
                href={`/admin/shops/${demoShop.id}/settings`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Settings className="h-3.5 w-3.5" aria-hidden />
                Config vitrine
              </Link>
              <Link
                href={`/admin/shops/${demoShop.id}/vitrine/mise-en-page`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                Mise en page
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
