"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  CreditCard,
  Zap,
  Moon,
  Store,
  Smartphone,
  UtensilsCrossed,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { LandingDemoHeroData } from "@/lib/fetchLandingDemoHero";

// ── Animation helpers ──────────────────────────────────────────

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── Hero : visuels alignés sur la démo active (/demo) ──────────

function HeroDemoPreview({ hero }: { hero: LandingDemoHeroData }) {
  return (
    <Link href="/demo" className="group block">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
        className="relative"
      >
        <div className="rounded-2xl border border-border bg-background shadow-xl overflow-hidden ring-1 ring-foreground/[0.04] transition-shadow group-hover:shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/35">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Démo en ligne</p>
              <p className="text-sm font-bold truncate" style={{ fontFamily: "var(--font-onest)" }}>
                {hero.shopName}
              </p>
            </div>
            <span className="text-xs font-semibold shrink-0 text-foreground">
              Voir la démo →
            </span>
          </div>

          {hero.tiles.length === 0 && hero.shopSlug ? (
            <div className="min-h-[200px] flex items-center justify-center px-4 py-10 bg-muted/25">
              <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                Aucun produit disponible sur cette vitrine pour l’instant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 sm:p-2.5 bg-muted/25">
              {hero.tiles.map((tile, i) => (
                <div
                  key={`${tile.id}-${i}`}
                  className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted shadow-sm"
                >
                  {tile.imageUrl ? (
                    <img
                      src={tile.imageUrl}
                      alt={tile.label}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
                      <span className="text-4xl select-none" aria-hidden>
                        🍽️
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/65 pt-10 pb-2 px-2">
                    <p className="text-[11px] font-semibold text-white leading-snug line-clamp-2">{tile.label}</p>
                    <p className="text-[11px] text-white/90 font-medium tabular-nums">{tile.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-3 py-2.5 border-t border-border text-center bg-background/80">
            {hero.shopSlug ? (
              <p className="text-[11px] text-muted-foreground leading-snug">
                Produits de la vitrine{" "}
                <span className="font-mono text-foreground/85">/{hero.shopSlug}</span>
                <span className="text-muted-foreground"> — servie sur </span>
                <span className="font-mono text-foreground/85">/demo</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-snug">
                Aperçu type carte — ouvrez <span className="font-mono text-foreground/85">/demo</span> pour la version
                interactive
              </p>
            )}
          </div>
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-16 w-2/3 rounded-full bg-foreground/10 blur-3xl opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />
      </motion.div>

      <p className="mt-3 text-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Parcourir la vitrine démo →
      </p>
    </Link>
  );
}

// ── Data ───────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte gratuitement",
    desc: "Inscription en 30 secondes. Configurez votre boutique avec votre nom, logo et horaires.",
  },
  {
    n: "02",
    title: "Ajoutez vos plats et vos formules",
    desc: "Organisez votre menu en catégories, créez des formules et définissez vos options de personnalisation.",
  },
  {
    n: "03",
    title: "Imprimez vos QR codes et recevez les commandes",
    desc: "Déposez le QR code sur vos tables. Vos clients scannent, commandent et paient en quelques secondes.",
  },
];

type LandingCommerceTile = { emoji: string; label: string };

/** Ligne 1 — restauration & alimentaire */
const COMMERCE_ROW_A: LandingCommerceTile[] = [
  { emoji: "🍽️", label: "Restaurant" },
  { emoji: "☕", label: "Café" },
  { emoji: "🫖", label: "Salon de thé" },
  { emoji: "🥐", label: "Boulangerie" },
  { emoji: "🧁", label: "Pâtisserie" },
  { emoji: "🍱", label: "Traiteur" },
  { emoji: "🍺", label: "Bar" },
  { emoji: "🍻", label: "Brasserie" },
  { emoji: "🍕", label: "Pizzeria" },
  { emoji: "🚚", label: "Food truck" },
  { emoji: "🛒", label: "Épicerie fine" },
  { emoji: "🧀", label: "Fromagerie" },
  { emoji: "🍦", label: "Glacier" },
  { emoji: "🍷", label: "Caviste" },
  { emoji: "🧃", label: "Bar à jus" },
  { emoji: "🥞", label: "Crêperie" },
  { emoji: "🍣", label: "Sushi bar" },
  { emoji: "🥂", label: "Bistro" },
  { emoji: "🍗", label: "Rotisserie" },
  { emoji: "🍫", label: "Chocolaterie" },
  { emoji: "🐟", label: "Poissonnerie" },
  { emoji: "🥩", label: "Boucherie" },
  { emoji: "🥓", label: "Charcuterie" },
  { emoji: "🥪", label: "Sandwicherie" },
  { emoji: "🍲", label: "Cantine" },
  { emoji: "👨‍🍳", label: "Dark kitchen" },
  { emoji: "🫒", label: "Tapas" },
  { emoji: "🍳", label: "Brunch" },
];

/** Ligne 2 — artisanat, services & commerce */
const COMMERCE_ROW_B: LandingCommerceTile[] = [
  { emoji: "📷", label: "Photographe" },
  { emoji: "💐", label: "Fleuriste" },
  { emoji: "📚", label: "Librairie" },
  { emoji: "✏️", label: "Papeterie" },
  { emoji: "💇", label: "Coiffeur" },
  { emoji: "💈", label: "Barbier" },
  { emoji: "💅", label: "Institut de beauté" },
  { emoji: "🧖", label: "Spa" },
  { emoji: "🏋️", label: "Salle de sport" },
  { emoji: "🧘", label: "Studio yoga" },
  { emoji: "💍", label: "Bijouterie" },
  { emoji: "⌚", label: "Horlogerie" },
  { emoji: "🖼️", label: "Galerie d'art" },
  { emoji: "👗", label: "Boutique de vêtements" },
  { emoji: "🧵", label: "Mercerie" },
  { emoji: "🏺", label: "Potier" },
  { emoji: "🫙", label: "Céramiste" },
  { emoji: "✨", label: "Joaillerie" },
  { emoji: "👓", label: "Opticien" },
  { emoji: "🐾", label: "Animalerie" },
  { emoji: "🌱", label: "Jardinerie" },
  { emoji: "🥬", label: "Primeur" },
  { emoji: "🥕", label: "Primeur bio" },
  { emoji: "♻️", label: "Vrac & zéro déchet" },
  { emoji: "👞", label: "Cordonnier" },
  { emoji: "👔", label: "Pressing" },
  { emoji: "🔧", label: "Atelier réparation" },
  { emoji: "🎲", label: "Magasin de jeux" },
  { emoji: "🛍️", label: "Concept store" },
  { emoji: "🏪", label: "Épicerie de quartier" },
];

function CommerceMarqueeCard({ emoji, label }: LandingCommerceTile) {
  return (
    <div className="flex h-36 w-[7.25rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 shadow-sm select-none sm:w-32">
      <span className="text-3xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="line-clamp-2 px-2 text-center text-xs font-semibold leading-tight text-foreground/85">{label}</span>
    </div>
  );
}

function CommerceMarqueeTrack({
  items,
  durationSec,
  reverse,
}: {
  items: readonly LandingCommerceTile[];
  durationSec: number;
  reverse?: boolean;
}) {
  const loop = [...items, ...items];
  return (
    <>
      <div className="hidden motion-reduce:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-4 max-w-6xl mx-auto">
        {items.map((tile) => (
          <CommerceMarqueeCard key={tile.label} {...tile} />
        ))}
      </div>
      <div className="motion-reduce:hidden landing-marquee-row" aria-hidden="true">
        <div
          className={`landing-marquee-track py-1 ${reverse ? "landing-marquee-track--reverse" : ""}`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loop.map((tile, i) => (
            <CommerceMarqueeCard key={`${tile.label}-${i}`} {...tile} />
          ))}
        </div>
      </div>
    </>
  );
}

function CommerceMarqueeSection() {
  return (
    <div className="flex flex-col gap-4">
      <CommerceMarqueeTrack items={COMMERCE_ROW_A} durationSec={176} reverse />
      <CommerceMarqueeTrack items={COMMERCE_ROW_B} durationSec={296} />
    </div>
  );
}

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "Vitrine toujours en ligne",
    desc: "Votre carte est accessible 24h/24, depuis n'importe quel smartphone. Aucune app à télécharger.",
  },
  {
    icon: Zap,
    title: "Gestion en temps réel",
    desc: "Modifiez un prix, activez ou désactivez un plat instantanément depuis votre téléphone.",
  },
  {
    icon: QrCode,
    title: "QR Code par table",
    desc: "Le client scanne, commande et paie. Vous recevez la commande immédiatement sur votre interface.",
  },
  {
    icon: CreditCard,
    title: "Paiement Stripe intégré",
    desc: "Checkout sécurisé. Les paiements sont versés directement sur votre compte, sans intermédiaire.",
  },
  {
    icon: Store,
    title: "Allergènes & options",
    desc: "Affichez les allergènes, proposez des options (taille, cuisson…) et acceptez les notes spéciales.",
  },
  {
    icon: Layers,
    title: "Multi-boutiques",
    desc: "Gérez plusieurs établissements depuis un seul compte. Idéal pour les groupes de restauration.",
  },
  {
    icon: Smartphone,
    title: "5 minutes, sans technique",
    desc: "Aucune compétence requise. Votre vitrine en ligne est opérationnelle en moins de 5 minutes.",
  },
  {
    icon: Moon,
    title: "Mode sombre inclus",
    desc: "Interface optimisée jour et nuit, automatiquement adaptée au système de vos clients.",
  },
];

const PRICING_POINTS = [
  "Vitrine gratuite toujours en ligne",
  "QR Code par table inclus",
  "Commandes en temps réel",
  "Aucune commission sur vos ventes",
];

export function LandingPageClient({ hero }: { hero: LandingDemoHeroData }) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <AppBrandMark variant="header" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Connexion
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-white">
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  Pour les restaurateurs &amp; commerçants
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-onest)" }}
                >
                  Lancez votre{" "}
                  <span className="text-foreground">carte digitale</span>
                  <br />
                  en{" "}
                  <span className="relative whitespace-nowrap">
                    5 minutes
                    <svg
                      className="absolute -bottom-1 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 6 Q50 2 100 5 Q150 8 198 4"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                        opacity="0.5"
                      />
                    </svg>
                  </span>
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Fini les menus PDF périmés et les cartes papier. Votre vitrine en ligne se met à jour en un clic,
                  vos clients commandent depuis leur téléphone — sans commission sur vos ventes.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/register" className={buttonVariants({ size: "lg" })}>
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/demo" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Voir la démo
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                  {["Aucune carte requise", "Gratuit pour démarrer", "Configuration en 5 min"].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                      {item}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md">
                <HeroDemoPreview hero={hero} />
              </div>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="py-20 md:py-28 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                Simple comme bonjour
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                Comment ça marche
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.1}>
                  <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm h-full">
                    {i < STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-10 -right-5 lg:-right-6 w-10 lg:w-12 h-px bg-border z-10" />
                    )}
                    <div className="text-4xl font-black mb-4 leading-none text-foreground/25" style={{ fontFamily: "var(--font-onest)" }}>
                      {step.n}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 overflow-x-hidden bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-10 md:mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                Polyvalent
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                Pour tous les commerces
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Bento s&apos;adapte à tous les types de commerces alimentaires et artisanaux.
              </p>
            </Reveal>
          </div>

          <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
            <Reveal delay={0.08}>
              <CommerceMarqueeSection />
            </Reveal>
          </div>
        </section>

        <section id="fonctionnalites" className="py-20 md:py-28 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                Tout ce dont vous avez besoin
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                Fonctionnalités
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.05}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm h-full hover:border-muted-foreground/20 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4 bg-muted">
                      <f.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-bold mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 relative overflow-hidden bg-white">
          <Reveal className="relative mx-auto max-w-2xl px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
              Votre menu en ligne, en 5 minutes
            </h2>
            <p className="text-muted-foreground text-lg">
              Créez votre carte gratuitement. Vos clients scannent le QR code, commandent et paient — vous gérez tout
              depuis votre téléphone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Créer ma vitrine gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              {PRICING_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AppBrandMark
              variant="header"
              className="rounded-md bg-background px-1 py-0.5 ring-1 ring-border/70 dark:ring-border"
            />
            <div className="flex items-center gap-2">
              <span>Mehdi Monteyremard</span>
              <span className="text-muted-foreground/50">©</span>
              <span>2026</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
