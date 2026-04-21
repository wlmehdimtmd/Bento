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
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useLocale } from "@/components/i18n/LocaleProvider";
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

function HeroDemoPreview({
  hero,
  t,
}: {
  hero: LandingDemoHeroData;
  t: (key: string, fallback?: string) => string;
}) {
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
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("landing.demo.online")}</p>
              <p className="text-sm font-bold truncate" style={{ fontFamily: "var(--font-onest)" }}>
                {hero.shopName}
              </p>
            </div>
            <span className="text-xs font-semibold shrink-0 text-foreground">
              {t("landing.demo.view")} →
            </span>
          </div>

          {hero.tiles.length === 0 && hero.shopSlug ? (
            <div className="min-h-[200px] flex items-center justify-center px-4 py-10 bg-muted/25">
              <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                {t("landing.demo.empty")}
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
                  <div className="absolute bottom-2 left-2 z-10 flex w-fit max-w-[calc(100%-1rem)] flex-col gap-0.5 rounded-lg bg-white/85 px-2 py-1.5 shadow-sm dark:bg-black/65 dark:shadow-none">
                    <p className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2 dark:text-white">
                      {tile.label}
                    </p>
                    <p className="text-[11px] text-foreground/90 font-medium tabular-nums dark:text-white/90">
                      {tile.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-3 py-2.5 border-t border-border text-center bg-background/80">
            {hero.shopSlug ? (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t("landing.demo.productsFromStorefront")}{" "}
                <span className="font-mono text-foreground/85">/{hero.shopSlug}</span>
                <span className="text-muted-foreground"> {t("landing.demo.servedOn")} </span>
                <span className="font-mono text-foreground/85">/demo</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {t("landing.demo.previewCard")} <span className="font-mono text-foreground/85">/demo</span>{" "}
                {t("landing.demo.previewInteractive")}
              </p>
            )}
          </div>
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-16 w-2/3 rounded-full bg-foreground/10 blur-3xl opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none" />
      </motion.div>

      <p className="mt-3 text-center text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        {t("landing.demo.browseCta")} →
      </p>
    </Link>
  );
}

// ── Data ───────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    titleKey: "landing.steps.01.title",
    descKey: "landing.steps.01.desc",
  },
  {
    n: "02",
    titleKey: "landing.steps.02.title",
    descKey: "landing.steps.02.desc",
  },
  {
    n: "03",
    titleKey: "landing.steps.03.title",
    descKey: "landing.steps.03.desc",
  },
];

type LandingCommerceTile = { emoji: string; labelFr: string; labelEn: string };

/** Ligne 1 — restauration & alimentaire */
const COMMERCE_ROW_A: LandingCommerceTile[] = [
  { emoji: "🍽️", labelFr: "Restaurant", labelEn: "Restaurant" },
  { emoji: "☕", labelFr: "Café", labelEn: "Cafe" },
  { emoji: "🫖", labelFr: "Salon de thé", labelEn: "Tea room" },
  { emoji: "🥐", labelFr: "Boulangerie", labelEn: "Bakery" },
  { emoji: "🧁", labelFr: "Pâtisserie", labelEn: "Pastry shop" },
  { emoji: "🍱", labelFr: "Traiteur", labelEn: "Caterer" },
  { emoji: "🍺", labelFr: "Bar", labelEn: "Bar" },
  { emoji: "🍻", labelFr: "Brasserie", labelEn: "Brasserie" },
  { emoji: "🍕", labelFr: "Pizzeria", labelEn: "Pizzeria" },
  { emoji: "🚚", labelFr: "Food truck", labelEn: "Food truck" },
  { emoji: "🛒", labelFr: "Épicerie fine", labelEn: "Delicatessen" },
  { emoji: "🧀", labelFr: "Fromagerie", labelEn: "Cheese shop" },
  { emoji: "🍦", labelFr: "Glacier", labelEn: "Ice cream shop" },
  { emoji: "🍷", labelFr: "Caviste", labelEn: "Wine shop" },
  { emoji: "🧃", labelFr: "Bar à jus", labelEn: "Juice bar" },
  { emoji: "🥞", labelFr: "Crêperie", labelEn: "Creperie" },
  { emoji: "🍣", labelFr: "Sushi bar", labelEn: "Sushi bar" },
  { emoji: "🥂", labelFr: "Bistro", labelEn: "Bistro" },
  { emoji: "🍗", labelFr: "Rotisserie", labelEn: "Rotisserie" },
  { emoji: "🍫", labelFr: "Chocolaterie", labelEn: "Chocolate shop" },
  { emoji: "🐟", labelFr: "Poissonnerie", labelEn: "Fishmonger" },
  { emoji: "🥩", labelFr: "Boucherie", labelEn: "Butcher shop" },
  { emoji: "🥓", labelFr: "Charcuterie", labelEn: "Deli meats" },
  { emoji: "🥪", labelFr: "Sandwicherie", labelEn: "Sandwich shop" },
  { emoji: "🍲", labelFr: "Cantine", labelEn: "Canteen" },
  { emoji: "👨‍🍳", labelFr: "Dark kitchen", labelEn: "Dark kitchen" },
  { emoji: "🫒", labelFr: "Tapas", labelEn: "Tapas" },
  { emoji: "🍳", labelFr: "Brunch", labelEn: "Brunch" },
];

/** Ligne 2 — artisanat, services & commerce */
const COMMERCE_ROW_B: LandingCommerceTile[] = [
  { emoji: "📷", labelFr: "Photographe", labelEn: "Photographer" },
  { emoji: "💐", labelFr: "Fleuriste", labelEn: "Florist" },
  { emoji: "📚", labelFr: "Librairie", labelEn: "Bookstore" },
  { emoji: "✏️", labelFr: "Papeterie", labelEn: "Stationery shop" },
  { emoji: "💇", labelFr: "Coiffeur", labelEn: "Hair salon" },
  { emoji: "💈", labelFr: "Barbier", labelEn: "Barber" },
  { emoji: "💅", labelFr: "Institut de beauté", labelEn: "Beauty salon" },
  { emoji: "🧖", labelFr: "Spa", labelEn: "Spa" },
  { emoji: "🏋️", labelFr: "Salle de sport", labelEn: "Gym" },
  { emoji: "🧘", labelFr: "Studio yoga", labelEn: "Yoga studio" },
  { emoji: "💍", labelFr: "Bijouterie", labelEn: "Jewelry store" },
  { emoji: "⌚", labelFr: "Horlogerie", labelEn: "Watchmaker" },
  { emoji: "🖼️", labelFr: "Galerie d'art", labelEn: "Art gallery" },
  { emoji: "👗", labelFr: "Boutique de vêtements", labelEn: "Clothing boutique" },
  { emoji: "🧵", labelFr: "Mercerie", labelEn: "Haberdashery" },
  { emoji: "🏺", labelFr: "Potier", labelEn: "Potter" },
  { emoji: "🫙", labelFr: "Céramiste", labelEn: "Ceramicist" },
  { emoji: "✨", labelFr: "Joaillerie", labelEn: "Jeweler" },
  { emoji: "👓", labelFr: "Opticien", labelEn: "Optician" },
  { emoji: "🐾", labelFr: "Animalerie", labelEn: "Pet store" },
  { emoji: "🌱", labelFr: "Jardinerie", labelEn: "Garden center" },
  { emoji: "🥬", labelFr: "Primeur", labelEn: "Greengrocer" },
  { emoji: "🥕", labelFr: "Primeur bio", labelEn: "Organic greengrocer" },
  { emoji: "♻️", labelFr: "Vrac & zéro déchet", labelEn: "Bulk & zero waste" },
  { emoji: "👞", labelFr: "Cordonnier", labelEn: "Shoemaker" },
  { emoji: "👔", labelFr: "Pressing", labelEn: "Dry cleaner" },
  { emoji: "🔧", labelFr: "Atelier réparation", labelEn: "Repair workshop" },
  { emoji: "🎲", labelFr: "Magasin de jeux", labelEn: "Game store" },
  { emoji: "🛍️", labelFr: "Concept store", labelEn: "Concept store" },
  { emoji: "🏪", labelFr: "Épicerie de quartier", labelEn: "Neighborhood grocery" },
];

function CommerceMarqueeCard({
  emoji,
  labelFr,
  labelEn,
  locale,
}: LandingCommerceTile & { locale: "fr" | "en" }) {
  return (
    <div className="flex h-36 w-[7.25rem] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 shadow-sm select-none sm:w-32">
      <span className="text-3xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="line-clamp-2 px-2 text-center text-xs font-semibold leading-tight text-foreground/85">
        {locale === "en" ? labelEn : labelFr}
      </span>
    </div>
  );
}

function CommerceMarqueeTrack({
  items,
  durationSec,
  reverse,
  locale,
}: {
  items: readonly LandingCommerceTile[];
  durationSec: number;
  reverse?: boolean;
  locale: "fr" | "en";
}) {
  const loop = [...items, ...items];
  return (
    <>
      <div className="hidden motion-reduce:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 px-4 max-w-6xl mx-auto">
        {items.map((tile) => (
          <CommerceMarqueeCard key={`${tile.labelFr}-${tile.labelEn}`} {...tile} locale={locale} />
        ))}
      </div>
      <div className="motion-reduce:hidden landing-marquee-row" aria-hidden="true">
        <div
          className={`landing-marquee-track py-1 ${reverse ? "landing-marquee-track--reverse" : ""}`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loop.map((tile, i) => (
            <CommerceMarqueeCard key={`${tile.labelFr}-${tile.labelEn}-${i}`} {...tile} locale={locale} />
          ))}
        </div>
      </div>
    </>
  );
}

function CommerceMarqueeSection({ locale }: { locale: "fr" | "en" }) {
  return (
    <div className="flex flex-col gap-4">
      <CommerceMarqueeTrack items={COMMERCE_ROW_A} durationSec={176} reverse locale={locale} />
      <CommerceMarqueeTrack items={COMMERCE_ROW_B} durationSec={296} locale={locale} />
    </div>
  );
}

const FEATURES = [
  {
    icon: UtensilsCrossed,
    titleKey: "landing.features.alwaysOnline.title",
    descKey: "landing.features.alwaysOnline.desc",
  },
  {
    icon: Zap,
    titleKey: "landing.features.realtime.title",
    descKey: "landing.features.realtime.desc",
  },
  {
    icon: QrCode,
    titleKey: "landing.features.qrTable.title",
    descKey: "landing.features.qrTable.desc",
  },
  {
    icon: CreditCard,
    titleKey: "landing.features.stripe.title",
    descKey: "landing.features.stripe.desc",
  },
  {
    icon: Store,
    titleKey: "landing.features.allergens.title",
    descKey: "landing.features.allergens.desc",
  },
  {
    icon: Layers,
    titleKey: "landing.features.multishop.title",
    descKey: "landing.features.multishop.desc",
  },
  {
    icon: Smartphone,
    titleKey: "landing.features.noTech.title",
    descKey: "landing.features.noTech.desc",
  },
  {
    icon: Moon,
    titleKey: "landing.features.darkMode.title",
    descKey: "landing.features.darkMode.desc",
  },
];

const PRICING_POINTS = [
  "landing.cta.final.point.online",
  "landing.cta.final.point.qr",
  "landing.cta.final.point.realtime",
  "landing.cta.final.point.noCommission",
];

export function LandingPageClient({ hero }: { hero: LandingDemoHeroData }) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <AppBrandMark variant="header" />

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("common.login")}
            </Link>
            <Link href="/register" className={buttonVariants({ size: "sm" })}>
              {t("common.register")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-background">
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  {t("landing.badge")}
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-onest)" }}
                >
                  {t("landing.hero.title.line1Prefix")}{" "}
                  <span className="text-foreground">{t("landing.hero.title.line1Highlight")}</span>
                  <br />
                  {t("landing.hero.title.line2Prefix")}{" "}
                  <span className="relative whitespace-nowrap">
                    {t("landing.hero.title.line2Highlight")}
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
                  {t("landing.hero.subtitle")}
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/register" className={buttonVariants({ size: "lg" })}>
                    {t("landing.cta.start")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/demo" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    {t("landing.cta.demo")}
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                  {["landing.hero.bullet.noCard", "landing.hero.bullet.freeStart", "landing.hero.bullet.setup"].map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                      {t(item)}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-md">
                <HeroDemoPreview hero={hero} t={t} />
              </div>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="py-20 md:py-28 bg-background">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                {t("landing.steps.overline")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                {t("landing.steps.title")}
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
                    <h3 className="font-bold text-lg mb-2">{t(step.titleKey)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(step.descKey)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 overflow-x-hidden bg-background">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-10 md:mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                {t("landing.commerce.overline")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                {t("landing.commerce.title")}
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                {t("landing.commerce.subtitle")}
              </p>
            </Reveal>
          </div>

          <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
            <Reveal delay={0.08}>
              <CommerceMarqueeSection locale={locale} />
            </Reveal>
          </div>
        </section>

        <section id="fonctionnalites" className="py-20 md:py-28 bg-background">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-foreground">
                {t("landing.features.overline")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
                {t("landing.features.title")}
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.titleKey} delay={i * 0.05}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm h-full hover:border-muted-foreground/20 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4 bg-muted">
                      <f.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-bold mb-1.5">{t(f.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 relative overflow-hidden bg-background">
          <Reveal className="relative mx-auto max-w-2xl px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "var(--font-onest)" }}>
              {t("landing.cta.final.title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("landing.cta.final.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                {t("landing.cta.final.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
              {PRICING_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />
                  {t(p)}
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
            <LocaleSwitcher />
            <Link href="/login" className="hover:text-foreground transition-colors">
              {t("common.login")}
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              {t("common.register")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t("landing.footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t("landing.footer.terms")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
