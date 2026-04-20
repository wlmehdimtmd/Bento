"use client";

import Link from "next/link";
import { toast } from "sonner";

import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/10">
      <header>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function SemanticTile({
  label,
  tw,
  className,
}: {
  label: string;
  tw: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.5rem] flex-col justify-end rounded-lg border border-border/80 p-3 text-xs font-medium shadow-sm",
        className,
      )}
    >
      <span className="opacity-90">{label}</span>
      <code className="mt-1 block truncate font-mono text-[10px] font-normal opacity-80">
        {tw}
      </code>
    </div>
  );
}

const TYPO_SCALE = [
  { cls: "text-xs", label: "text-xs", rem: "0.75rem" },
  { cls: "text-sm", label: "text-sm", rem: "0.875rem" },
  { cls: "text-base", label: "text-base", rem: "1rem" },
  { cls: "text-lg", label: "text-lg", rem: "1.125rem" },
  { cls: "text-xl", label: "text-xl", rem: "1.25rem" },
  { cls: "text-2xl", label: "text-2xl", rem: "1.5rem" },
  { cls: "text-3xl", label: "text-3xl", rem: "1.875rem" },
  { cls: "text-4xl", label: "text-4xl", rem: "2.25rem" },
] as const;

export function DevDaClient() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-heading text-base font-semibold">
              Direction artistique
            </span>
            <span className="text-xs text-muted-foreground">
              Tokens, typographie et repères visuels — aligné sur{" "}
              <code className="rounded bg-muted px-1 py-0.5">globals.css</code>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dev"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Hub dev
            </Link>
            <ThemeToggle />
            <Link
              href="/dev/ui"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Playground UI
            </Link>
            <Link
              href="/dev/onboarding"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Onboarding dev
            </Link>
          </div>
        </div>
      </div>

      <main
        id="main-content"
        className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6"
      >
        <Section
          title="Identité — marque"
          description="Composant AppBrandMark : même rendu que header public et cartes auth."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                variant=&quot;header&quot;
              </p>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <AppBrandMark variant="header" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                variant=&quot;auth&quot;
              </p>
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                <AppBrandMark variant="auth" className="inline-block" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Référence documentaire (CLAUDE.md) : fond clair type{" "}
            <code className="rounded bg-muted px-1">#faf9f6</code>, texte{" "}
            <code className="rounded bg-muted px-1">#1a1a1a</code>, accents{" "}
            <code className="rounded bg-muted px-1">#e85d04</code> /{" "}
            <code className="rounded bg-muted px-1">#f4a261</code> (sombre) — portés
            en CSS via <code className="rounded bg-muted px-1">--color-cream</code>,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent</code>, etc.
          </p>
        </Section>

        <Section
          title="Typographie"
          description="Inter pour le corps (font-sans), Onest pour les titres (font-heading / --font-onest)."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Corps — font-sans (Inter)
              </p>
              <p className="font-sans text-base leading-relaxed text-foreground">
                Le corps de texte utilise Inter pour une lecture confortable sur mobile
                et desktop. Mobile-first : privilégier des paragraphes{" "}
                <code className="rounded bg-muted px-1 text-sm">text-sm</code> ou{" "}
                <code className="rounded bg-muted px-1 text-sm">text-base</code> selon
                la densité.
              </p>
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Titres — font-heading (Onest)
              </p>
              <h3 className="font-heading text-2xl font-bold tracking-tight">
                Titre section
              </h3>
              <h4 className="font-heading text-lg font-semibold tracking-tight">
                Sous-titre carte
              </h4>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Échelle Tailwind (aperçu)
            </p>
            <div className="space-y-2 rounded-lg border border-border p-4">
              {TYPO_SCALE.map(({ cls, label, rem }) => (
                <div
                  key={cls}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-2 last:border-0"
                >
                  <span className={cn(cls, "font-heading text-foreground")}>
                    {label} — Ag {label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ~{rem}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Exemples responsive (marque dans le header)
            </p>
            <div className="rounded-lg border border-dashed border-border bg-background p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Emoji :{" "}
                <code className="rounded bg-muted px-1">text-xl sm:text-2xl</code> —
                libellé :{" "}
                <code className="rounded bg-muted px-1">text-lg font-bold</code>
              </p>
              <div className="flex min-w-0 items-center gap-2 text-foreground">
                <span className="text-xl leading-none sm:text-2xl shrink-0" aria-hidden>
                  🍱
                </span>
                <span className="min-w-0 truncate font-heading text-lg font-bold tracking-tight">
                  Bento Resto
                </span>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Couleurs marque"
          description="Tokens fixes dans @theme (hors inversion light/dark)."
        >
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <div className="h-16 w-28 rounded-xl border border-border bg-cream shadow-sm" />
              <p className="text-xs font-medium">cream</p>
              <code className="text-[10px] text-muted-foreground">bg-cream · #faf9f6</code>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-28 rounded-xl border border-border bg-charcoal shadow-sm" />
              <p className="text-xs font-medium text-foreground">charcoal</p>
              <code className="text-[10px] text-muted-foreground">
                bg-charcoal · #1a1a1a
              </code>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-28 rounded-xl border border-border bg-bento-accent shadow-sm" />
              <p className="text-xs font-medium text-white">bento-accent</p>
              <code className="text-[10px] text-muted-foreground">
                bg-bento-accent · #e85d04
              </code>
            </div>
            <div className="space-y-2">
              <div
                className="flex h-16 w-28 items-center justify-center rounded-xl border border-border text-xs font-semibold text-charcoal shadow-sm dark:text-foreground"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-bento-accent) 0%, var(--color-bento-accent-dark) 100%)",
                }}
              >
                Dégradé
              </div>
              <p className="text-xs font-medium">accent → accent-dark</p>
              <code className="text-[10px] text-muted-foreground">
                #f4a261 (dark mode accent UI)
              </code>
            </div>
          </div>
        </Section>

        <Section
          title="Tokens sémantiques (thème courant)"
          description="Ces couleurs suivent le mode clair / sombre global. Utilisez le toggle en haut pour comparer."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <SemanticTile
              label="background"
              tw="bg-background"
              className="bg-background text-foreground"
            />
            <SemanticTile
              label="foreground"
              tw="text-foreground"
              className="bg-muted text-foreground"
            />
            <SemanticTile
              label="card"
              tw="bg-card"
              className="bg-card text-card-foreground"
            />
            <SemanticTile
              label="popover"
              tw="bg-popover"
              className="bg-popover text-popover-foreground"
            />
            <SemanticTile
              label="primary"
              tw="bg-primary"
              className="bg-primary text-primary-foreground"
            />
            <SemanticTile
              label="secondary"
              tw="bg-secondary"
              className="bg-secondary text-secondary-foreground"
            />
            <SemanticTile
              label="muted"
              tw="bg-muted"
              className="bg-muted text-muted-foreground"
            />
            <SemanticTile
              label="accent"
              tw="bg-accent"
              className="bg-accent text-accent-foreground"
            />
            <SemanticTile
              label="destructive"
              tw="bg-destructive"
              className="bg-destructive text-destructive-foreground"
            />
            <SemanticTile
              label="border"
              tw="border-border"
              className="border-2 border-border bg-background text-foreground"
            />
            <SemanticTile
              label="input"
              tw="bg-input"
              className="bg-input text-foreground"
            />
            <SemanticTile
              label="ring"
              tw="ring-ring"
              className="bg-background text-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
            />
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Charts
          </p>
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <div
                key={n}
                className={cn(
                  "h-12 rounded-lg border border-border/60 text-center text-[10px] font-medium leading-[3rem] text-foreground",
                  n === 1 && "bg-chart-1",
                  n === 2 && "bg-chart-2",
                  n === 3 && "bg-chart-3",
                  n === 4 && "bg-chart-4",
                  n === 5 && "bg-chart-5",
                )}
              >
                {n}
              </div>
            ))}
          </div>

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sidebar
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <SemanticTile
              label="sidebar"
              tw="bg-sidebar"
              className="bg-sidebar text-sidebar-foreground"
            />
            <SemanticTile
              label="sidebar-primary"
              tw="bg-sidebar-primary"
              className="bg-sidebar-primary text-sidebar-primary-foreground"
            />
            <SemanticTile
              label="sidebar-accent"
              tw="bg-sidebar-accent"
              className="bg-sidebar-accent text-sidebar-accent-foreground"
            />
            <SemanticTile
              label="sidebar-border"
              tw="border-sidebar-border"
              className="border-2 bg-sidebar text-sidebar-foreground"
            />
          </div>
        </Section>

        <Section
          title="Dashboard marchand (override)"
          description="Sous .dark, le conteneur data-merchant-dashboard recâle fond, cartes et sidebar (voir commentaire dans globals.css)."
        >
          <p className="text-sm text-muted-foreground">
            Passez en <strong className="font-medium text-foreground">mode sombre</strong>{" "}
            pour voir la différence entre la grille de gauche (tokens vitrine) et celle
            de droite (même hiérarchie de tuiles, variables résolues dans{" "}
            <code className="rounded bg-muted px-1">data-merchant-dashboard</code>).
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Hors scope marchand
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3">
                <div className="h-14 rounded-lg bg-background ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-card text-card-foreground ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-sidebar text-sidebar-foreground ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-muted text-muted-foreground ring-1 ring-border" />
              </div>
            </div>
            <div className="space-y-2" data-merchant-dashboard>
              <p className="text-xs font-medium text-muted-foreground">
                data-merchant-dashboard
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3">
                <div className="h-14 rounded-lg bg-background ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-card text-card-foreground ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-sidebar text-sidebar-foreground ring-1 ring-border" />
                <div className="h-14 rounded-lg bg-muted text-muted-foreground ring-1 ring-border" />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Rayons et surfaces Bento"
          description="--radius par défaut 0.625rem ; cartes vitrine rounded-2xl alignées sur --bento-outer-r."
        >
          <div className="flex flex-wrap items-end gap-3">
            {(
              [
                "rounded-sm",
                "rounded-md",
                "rounded-lg",
                "rounded-xl",
                "rounded-2xl",
                "rounded-3xl",
                "rounded-4xl",
              ] as const
            ).map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "h-14 w-14 border-2 border-bento-accent bg-muted/40",
                    r,
                  )}
                />
                <code className="text-[10px] text-muted-foreground">{r}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1">--bento-outer-r</code> ={" "}
            <code className="rounded bg-muted px-1">var(--radius-2xl)</code> sur{" "}
            <code className="rounded bg-muted px-1">.bento-grid</code>
          </p>
        </Section>

        <Section
          title="Focus visible"
          description="Anneau global orange (accessibilité clavier), défini dans @layer base."
        >
          <p className="text-sm text-muted-foreground">
            Tabulation jusqu’au bouton ci-dessous : contour{" "}
            <code className="rounded bg-muted px-1">2px solid var(--color-bento-accent)</code>
            , offset 2px (voir{" "}
            <code className="rounded bg-muted px-1">globals.css</code>).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline">
              Focus clavier
            </Button>
            <a
              href="#main-content"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "underline-offset-4",
              )}
            >
              Lien ancré (scroll doux)
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Le layout racine inclut un lien « Aller au contenu » visible au focus (
            <code className="rounded bg-muted px-1">#main-content</code>).
          </p>
        </Section>

        <Section
          title="Toasts (Sonner)"
          description="Position imposée top-center ; styles liés aux tokens popover / border / radius."
        >
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1">position=&quot;top-center&quot;</code>
            </li>
            <li>
              Variables injectées :{" "}
              <code className="rounded bg-muted px-1">--normal-bg</code> → popover,{" "}
              <code className="rounded bg-muted px-1">--normal-border</code> → border,{" "}
              <code className="rounded bg-muted px-1">--border-radius</code> → radius
            </li>
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.success("Exemple DA — toast en haut-centre.")}
          >
            Déclencher un toast
          </Button>
        </Section>

        <Section
          title="Référence statique — variables CSS"
          description="Valeurs copiées depuis globals.css (:root, .dark, .dark [data-merchant-dashboard]). À jour si le fichier change. « — » = non redéfini dans le bloc marchand (hérite du contexte .dark)."
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Variable</th>
                  <th className="p-2 font-medium">:root</th>
                  <th className="p-2 font-medium">.dark</th>
                  <th className="p-2 font-medium">.dark [data-merchant-dashboard]</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[10px] text-muted-foreground">
                <TokenRow name="--background" light="oklch(1 0 0)" dark="oklch(0.12 0 0)" merch="oklch(0.128 0 0)" />
                <TokenRow name="--foreground" light="oklch(0.145 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--card" light="oklch(1 0 0)" dark="oklch(0.248 0 0)" merch="oklch(0.262 0 0)" />
                <TokenRow name="--card-foreground" light="oklch(0.145 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--popover" light="oklch(1 0 0)" dark="oklch(0.252 0 0)" merch="oklch(0.265 0 0)" />
                <TokenRow name="--popover-foreground" light="oklch(0.145 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--primary" light="oklch(0.205 0 0)" dark="oklch(0.922 0 0)" merch="—" />
                <TokenRow name="--primary-foreground" light="oklch(0.985 0 0)" dark="oklch(0.205 0 0)" merch="—" />
                <TokenRow name="--secondary" light="oklch(0.97 0 0)" dark="oklch(0.195 0 0)" merch="oklch(0.185 0 0)" />
                <TokenRow name="--secondary-foreground" light="oklch(0.205 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--muted" light="oklch(0.97 0 0)" dark="oklch(0.175 0 0)" merch="oklch(0.168 0 0)" />
                <TokenRow name="--muted-foreground" light="oklch(0.556 0 0)" dark="oklch(0.708 0 0)" merch="oklch(0.708 0 0)" />
                <TokenRow name="--accent" light="oklch(0.97 0 0)" dark="oklch(0.195 0 0)" merch="oklch(0.185 0 0)" />
                <TokenRow name="--accent-foreground" light="oklch(0.205 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--destructive" light="oklch(0.577 0.245 27.325)" dark="oklch(0.704 0.191 22.216)" merch="—" />
                <TokenRow name="--border" light="oklch(0.922 0 0)" dark="oklch(1 0 0 / 10%)" merch="oklch(1 0 0 / 10%)" />
                <TokenRow name="--input" light="oklch(0.922 0 0)" dark="oklch(1 0 0 / 15%)" merch="oklch(1 0 0 / 14%)" />
                <TokenRow name="--ring" light="oklch(0.708 0 0)" dark="oklch(0.556 0 0)" merch="—" />
                <TokenRow name="--chart-1" light="oklch(0.87 0 0)" dark="oklch(0.87 0 0)" merch="—" />
                <TokenRow name="--chart-2" light="oklch(0.556 0 0)" dark="oklch(0.556 0 0)" merch="—" />
                <TokenRow name="--chart-3" light="oklch(0.439 0 0)" dark="oklch(0.439 0 0)" merch="—" />
                <TokenRow name="--chart-4" light="oklch(0.371 0 0)" dark="oklch(0.371 0 0)" merch="—" />
                <TokenRow name="--chart-5" light="oklch(0.269 0 0)" dark="oklch(0.269 0 0)" merch="—" />
                <TokenRow name="--sidebar" light="oklch(0.985 0 0)" dark="oklch(0.195 0 0)" merch="oklch(0.095 0 0)" />
                <TokenRow name="--sidebar-foreground" light="oklch(0.145 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--sidebar-primary" light="oklch(0.205 0 0)" dark="oklch(0.488 0.243 264.376)" merch="oklch(0.488 0.243 264.376)" />
                <TokenRow name="--sidebar-primary-foreground" light="oklch(0.985 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--sidebar-accent" light="oklch(0.97 0 0)" dark="oklch(0.22 0 0)" merch="oklch(0.13 0 0)" />
                <TokenRow name="--sidebar-accent-foreground" light="oklch(0.205 0 0)" dark="oklch(0.985 0 0)" merch="oklch(0.985 0 0)" />
                <TokenRow name="--sidebar-border" light="oklch(0.922 0 0)" dark="oklch(1 0 0 / 10%)" merch="oklch(1 0 0 / 8%)" />
                <TokenRow name="--sidebar-ring" light="oklch(0.708 0 0)" dark="oklch(0.556 0 0)" merch="oklch(0.556 0 0)" />
                <TokenRow name="--radius" light="0.625rem" dark="—" merch="—" />
                <TokenRow name="--bento-outer-r" light="var(--radius-2xl)" dark="—" merch="—" />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Couleurs marque fixes :{" "}
            <code className="rounded bg-muted px-1">--color-cream</code> #faf9f6,{" "}
            <code className="rounded bg-muted px-1">--color-charcoal</code> #1a1a1a,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent</code> #e85d04,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent-dark</code>{" "}
            #f4a261
          </p>
        </Section>

        <Section
          title="Mouvement (landing)"
          description="Marquee landing : animation désactivée si prefers-reduced-motion."
        >
          <p className="text-sm text-muted-foreground">
            Classes <code className="rounded bg-muted px-1">.landing-marquee-row</code> /{" "}
            <code className="rounded bg-muted px-1">.landing-marquee-track</code> — durée
            90s, variante <code className="rounded bg-muted px-1">--reverse</code> pour la
            seconde rangée.
          </p>
        </Section>
      </main>
    </div>
  );
}

function TokenRow({
  name,
  light,
  dark,
  merch,
}: {
  name: string;
  light: string;
  dark: string;
  merch: string;
}) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="p-2 font-medium text-foreground">{name}</td>
      <td className="p-2">{light}</td>
      <td className="p-2">{dark}</td>
      <td className="p-2">{merch}</td>
    </tr>
  );
}
