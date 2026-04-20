"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactGridLayout, { WidthProvider, type Layout } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Moon, RotateCcw, Sun } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

import { BentoCardInfo } from "@/components/bento/BentoCardInfo";
import { BentoCardCategory } from "@/components/bento/BentoCardCategory";
import { BentoCardBundle } from "@/components/bento/BentoCardBundle";
import { BentoCardGallery } from "@/components/bento/BentoCardGallery";
import type { BundleInfo, CategoryInfo, ShopInfo } from "@/components/bento/StoreView";
import type { ShopReviews, StorefrontPhoto } from "@/lib/types";
import type { BentoSize } from "@/components/bento/BentoCard";
import {
  BUNDLES_MENU_TILE_ID,
  GALLERY_TILE_ID,
  buildDefaultStorefrontLayout,
  mergeStorefrontLayout,
  parseStorefrontBentoLayout,
} from "@/lib/storefrontBentoLayout";
import { BENTO_STAGGER_CONTAINER_VARIANTS } from "@/components/bento/BentoGrid";
import { saveStorefrontBentoLayoutAdmin } from "@/app/admin/actions";
import type { Json } from "@/lib/supabase/database.types";
import {
  CATEGORY_THEME_KEYS,
  CATEGORY_THEME_TOKENS,
  type CategoryThemeKey,
} from "@/lib/categoryThemeTokens";
import { getStorefrontThemePreviewStyle } from "@/lib/storefrontTheme";

const GridLayoutWithWidth = WidthProvider(ReactGridLayout);

const ROW_HEIGHT_PX = 224; // 14rem @ 16px

function whToBentoSize(w: number, h: number): BentoSize {
  const cw = Math.min(2, Math.max(1, Math.round(w)));
  const ch = Math.min(2, Math.max(1, Math.round(h)));
  if (cw === 2 && ch === 2) return "2x2";
  if (cw === 2 && ch === 1) return "2x1";
  if (cw === 1 && ch === 2) return "1x2";
  return "1x1";
}

function isMissingStorefrontLayoutColumn(message: string) {
  return /storefront_bento_layout|storefront_theme_key|schema cache/i.test(message);
}

function formatLayoutSaveError(message: string): string {
  if (isMissingStorefrontLayoutColumn(message)) {
    return "La colonne « storefront_bento_layout » ou « storefront_theme_key » n’existe pas encore sur la table « shops ». Exécutez les migrations SQL de vitrine (layout + thème), attendez ~1 minute (cache schéma), puis réessayez.";
  }
  return message;
}

/** Lien vers l’éditeur SQL du projet (dérivé de NEXT_PUBLIC_SUPABASE_URL). */
function getSupabaseSqlEditorUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes("localhost")) return null;
    const projectRef = host.split(".")[0];
    if (!projectRef) return null;
    return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  } catch {
    return null;
  }
}

function layoutToJson(layout: Layout) {
  return {
    lg: layout.map((it) => ({
      i: it.i,
      x: it.x,
      y: it.y,
      w: it.w,
      h: it.h,
      ...(it.minW != null ? { minW: it.minW } : {}),
      ...(it.minH != null ? { minH: it.minH } : {}),
      ...(it.maxW != null ? { maxW: it.maxW } : {}),
      ...(it.maxH != null ? { maxH: it.maxH } : {}),
    })),
  };
}

export interface StorefrontBentoEditorProps {
  shopId: string;
  slug: string;
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  bundlesMenuGrouped?: boolean;
  reviews?: ShopReviews | null;
  storefrontPhotos?: StorefrontPhoto[];
  initialLayout: unknown;
  initialStorefrontThemeKey: CategoryThemeKey;
  backHref?: string;
  /** `admin` : enregistrement via server action (requireAdmin). */
  layoutSaveMode?: "owner" | "admin";
}

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function StorefrontBentoEditor({
  shopId,
  slug,
  shop,
  categories,
  bundles,
  bundlesMenuGrouped = false,
  reviews,
  storefrontPhotos = [],
  initialLayout,
  initialStorefrontThemeKey,
  backHref,
  layoutSaveMode = "owner",
}: StorefrontBentoEditorProps) {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const defaults = useMemo(
    () =>
      buildDefaultStorefrontLayout(
        categories.map((c) => c.id),
        bundles.map((b) => b.id),
        { bundlesMenuGrouped, includeGallery: storefrontPhotos.some((p) => p.is_visible) }
      ),
    [categories, bundles, bundlesMenuGrouped, storefrontPhotos]
  );

  const initialMerged = useMemo(() => {
    const parsed = parseStorefrontBentoLayout(initialLayout);
    return mergeStorefrontLayout(parsed?.lg, defaults);
  }, [initialLayout, defaults]);

  const [layout, setLayout] = useState<Layout>(() => initialMerged as unknown as Layout);
  const [storefrontThemeKey, setStorefrontThemeKey] = useState<CategoryThemeKey>(
    initialStorefrontThemeKey
  );
  const [previewDarkMode, setPreviewDarkMode] = useState(isDark);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLayout(initialMerged as unknown as Layout);
  }, [initialMerged]);

  useEffect(() => {
    setStorefrontThemeKey(initialStorefrontThemeKey);
  }, [initialStorefrontThemeKey]);

  useEffect(() => {
    setPreviewDarkMode(isDark);
  }, [isDark]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const bundleById = useMemo(() => new Map(bundles.map((b) => [b.id, b])), [bundles]);

  const layoutMap = useMemo(() => new Map(layout.map((l) => [l.i, l])), [layout]);
  const storefrontThemeStyle = useMemo(
    () => getStorefrontThemePreviewStyle(storefrontThemeKey, previewDarkMode),
    [storefrontThemeKey, previewDarkMode]
  );

  function renderPreview(i: string) {
    const item = layoutMap.get(i);
    const size = item ? whToBentoSize(item.w, item.h) : ("1x1" as BentoSize);

    if (i === "info") {
      return (
        <BentoCardInfo
          cardSize={size}
          omitSizeClasses
          shopName={shop.name}
          shopSlug={shop.slug}
          description={shop.description}
          coverUrl={shop.cover_image_url}
          logoUrl={shop.logo_url}
          address={shop.address}
          phone={shop.phone}
          socialLinks={shop.social_links}
          reviews={reviews}
          fulfillmentModes={shop.fulfillment_modes}
          openingHoursJson={shop.opening_hours ?? null}
          openingTimezone={shop.opening_timezone ?? "Europe/Paris"}
          openOnPublicHolidays={shop.open_on_public_holidays ?? false}
        />
      );
    }

    if (i.startsWith("category:")) {
      const id = i.slice("category:".length);
      const cat = catById.get(id);
      if (!cat) return <div className="h-full w-full rounded-2xl border border-dashed border-border bg-muted/40" />;
      return (
        <BentoCardCategory
          name={cat.name}
          iconEmoji={cat.icon_emoji}
          productCount={cat.productCount}
          coverImageUrl={cat.cover_image_url}
          size={size}
          omitSizeClasses
        />
      );
    }

    if (i === BUNDLES_MENU_TILE_ID) {
      return (
        <BentoCardCategory
          name="Menu"
          iconEmoji="🍱"
          productCount={bundles.length}
          coverImageUrl={null}
          size={size}
          omitSizeClasses
        />
      );
    }

    if (i.startsWith("bundle:")) {
      const id = i.slice("bundle:".length);
      const b = bundleById.get(id);
      if (!b) return <div className="h-full w-full rounded-2xl border border-dashed border-border bg-muted/40" />;
      return (
        <BentoCardBundle
          name={b.name}
          description={b.description}
          price={b.price}
          imageUrl={b.image_url}
          slots={b.slots}
          size={size}
          omitSizeClasses
        />
      );
    }

    if (i === GALLERY_TILE_ID) {
      return (
        <BentoCardGallery
          photos={storefrontPhotos.filter((p) => p.is_visible)}
          size={size}
          omitSizeClasses
        />
      );
    }

    return null;
  }

  function handleResetToDefault() {
    setLayout(defaults as unknown as Layout);
    toast("Grille réinitialisée", {
      description:
        "Disposition automatique restaurée. Cliquez sur « Enregistrer » pour l’appliquer à la vitrine.",
    });
  }

  async function handleSave() {
    setSaving(true);
    const payload = layoutToJson(layout);

    if (layoutSaveMode === "admin") {
      try {
        await saveStorefrontBentoLayoutAdmin(shopId, payload as Json, storefrontThemeKey);
        toast.success("Mise en page enregistrée");
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Enregistrement impossible";
        const friendly = formatLayoutSaveError(raw);
        const sqlUrl = isMissingStorefrontLayoutColumn(raw) ? getSupabaseSqlEditorUrl() : null;
        toast.error(friendly, {
          duration: 22_000,
          ...(sqlUrl
            ? {
                action: {
                  label: "Ouvrir l’éditeur SQL",
                  onClick: () => window.open(sqlUrl, "_blank", "noopener,noreferrer"),
                },
              }
            : {}),
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("shops")
      .update({ storefront_bento_layout: payload, storefront_theme_key: storefrontThemeKey })
      .eq("id", shopId);

    setSaving(false);

    if (error) {
      const raw = error.message || "Enregistrement impossible";
      const friendly = formatLayoutSaveError(raw);
      const sqlUrl = isMissingStorefrontLayoutColumn(raw) ? getSupabaseSqlEditorUrl() : null;

      toast.error(friendly, {
        duration: 22_000,
        ...(sqlUrl
          ? {
              action: {
                label: "Ouvrir l’éditeur SQL",
                onClick: () => window.open(sqlUrl, "_blank", "noopener,noreferrer"),
              },
            }
          : {}),
      });
      return;
    }
    toast.success("Mise en page enregistrée");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {backHref ? (
            <Link
              href={backHref}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2 inline-flex")}
            >
              Retour
            </Link>
          ) : null}
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            Mise en page vitrine
          </h1>
          <p className="text-sm text-muted-foreground">
            Glissez et redimensionnez les tuiles (aperçu aligné sur la page publique).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex min-h-[44px] items-center gap-2"
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Voir la vitrine
          </Link>
          {!isMobile ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetToDefault}
                title="Rétablit la grille automatique (fiche + catégories + formules), comme avant toute personnalisation."
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser la grille
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: "var(--color-bento-accent)" }}
                className="text-white hover:opacity-90"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isMobile ? (
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-2xl border border-border bg-card/60 p-5 text-center sm:p-6">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
              Mise en page disponible sur ecran large
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour modifier la grille, agrandissez cette fenetre ou utilisez un ordinateur.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <section className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Palette de couleurs (vitrine uniquement)</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  L’aperçu est appliqué uniquement au bento ci-dessous, puis à la vitrine publique après
                  enregistrement.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewDarkMode((prev) => !prev)}
                className="inline-flex items-center gap-2"
              >
                {previewDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Tester en mode {previewDarkMode ? "clair" : "sombre"}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {CATEGORY_THEME_KEYS.map((themeKey) => {
                const token = CATEGORY_THEME_TOKENS[themeKey];
                const preview = previewDarkMode ? token.dark : token.light;
                const selected = storefrontThemeKey === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    className={cn(
                      "rounded-xl border p-2 text-left transition-colors",
                      selected
                        ? "border-[var(--color-bento-accent)] bg-accent/30"
                        : "border-border hover:bg-muted/40"
                    )}
                    onClick={() => setStorefrontThemeKey(themeKey)}
                    aria-pressed={selected}
                  >
                    <span className="mb-2 block text-xs font-medium">{token.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: preview.background }}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: preview.surface }}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: preview.card }}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="rounded-xl border border-border bg-background p-3 sm:p-4" style={storefrontThemeStyle}>
            <GridLayoutWithWidth
              className="layout"
              cols={4}
              rowHeight={ROW_HEIGHT_PX}
              margin={[16, 16]}
              containerPadding={[0, 0]}
              layout={layout}
              onLayoutChange={(l) => setLayout([...l] as Layout)}
              compactType="vertical"
              preventCollision={false}
              isBounded
              measureBeforeMount
            >
              {layout.map((it) => (
                <div
                  key={it.i}
                  className="h-full overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm"
                >
                  <motion.div
                    variants={BENTO_STAGGER_CONTAINER_VARIANTS}
                    initial="hidden"
                    animate="show"
                    className="pointer-events-none h-full w-full select-none"
                  >
                    {renderPreview(it.i)}
                  </motion.div>
                </div>
              ))}
            </GridLayoutWithWidth>
          </div>
        </div>
      )}
    </div>
  );
}
