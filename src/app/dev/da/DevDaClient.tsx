"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Circle, Plus } from "lucide-react";

import { AppBrandMark } from "@/components/layout/AppBrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_THEME_CARD_DARK_SEMI,
  CATEGORY_THEME_CARD_SEMI,
  CATEGORY_THEME_KEYS,
  CATEGORY_THEME_TOKENS,
  DEFAULT_CATEGORY_THEME_KEY,
  STOREFRONT_GLOBAL_ACCENT_HEX,
  type CategoryThemeKey,
} from "@/lib/categoryThemeTokens";
import { createClient } from "@/lib/supabase/client";
import {
  coerceStorefrontThemeKey,
  coerceStorefrontThemeOverrides,
  getStorefrontThemeScaleWithOverrides,
  type StorefrontThemeOverrides,
} from "@/lib/storefrontTheme";
import {
  formatLayoutSaveError,
  getSupabaseSqlEditorUrl,
  isMissingStorefrontLayoutColumn,
  isShopRowLevelSecurityDenied,
} from "@/lib/storefrontSchemaErrors";
import { ensureDefaultShopForOwner } from "@/lib/merchant-bootstrap";
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

type PreviewMode = "light" | "dark";
type EditableColorField = "background" | "surface" | "card" | "text" | "primaryBg" | "primaryText";

export function DevDaClient() {
  const supabase = useMemo(() => createClient(), []);
  const [selectedThemeKey, setSelectedThemeKey] = useState<CategoryThemeKey>("indigo");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("light");
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<StorefrontThemeOverrides>({});
  const [loadingShop, setLoadingShop] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopLoadBanner, setShopLoadBanner] = useState<{
    text: string;
    sqlUrl: string | null;
  } | null>(null);
  /** Pourquoi « Enregistrer » reste désactivé alors que le reset (local) fonctionne. */
  const [saveBlockedReason, setSaveBlockedReason] = useState<"guest" | "no_shop" | null>(
    null
  );

  useEffect(() => {
    let alive = true;

    async function loadShopThemeEditorContext() {
      setLoadingShop(true);
      setShopLoadBanner(null);
      setSaveBlockedReason(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!alive) return;
      if (userError || !user) {
        setShopId(null);
        setShopName(null);
        setOverrides({});
        setSelectedThemeKey(DEFAULT_CATEGORY_THEME_KEY);
        setSaveBlockedReason("guest");
        setLoadingShop(false);
        return;
      }

      const { data: shopBase, error: baseError } = await supabase
        .from("shops")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!alive) return;

      if (baseError) {
        console.error("[DevDaClient] unable to load shop (base)", baseError);
        const raw = baseError.message ?? "";
        setShopLoadBanner({
          text: formatLayoutSaveError(raw),
          sqlUrl: isMissingStorefrontLayoutColumn(raw) ? getSupabaseSqlEditorUrl() : null,
        });
        toast.error("Impossible de charger la boutique pour l’éditeur de couleurs.");
        setShopId(null);
        setShopName(null);
        setSaveBlockedReason("no_shop");
        setLoadingShop(false);
        return;
      }

      let resolvedId: string | null = null;
      let resolvedName: string | null = null;

      if (shopBase) {
        resolvedId = shopBase.id;
        resolvedName = shopBase.name;
      } else {
        const displayName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : (user.email?.split("@")[0] ?? null);
        const ensured = await ensureDefaultShopForOwner(supabase, user.id, displayName);
        if (!alive) return;
        if (!ensured.ok) {
          console.error("[DevDaClient] ensureDefaultShopForOwner", ensured.error);
          setShopLoadBanner({
            text: `Aucune boutique pour ce compte et création automatique impossible : ${ensured.error}. Créez une boutique depuis l’onboarding ou le tableau de bord.`,
            sqlUrl: null,
          });
          toast.error("Enregistrement désactivé : aucune boutique utilisable.");
          setShopId(null);
          setShopName(null);
          setSaveBlockedReason("no_shop");
          setLoadingShop(false);
          return;
        }
        const { data: row } = await supabase
          .from("shops")
          .select("id, name")
          .eq("id", ensured.shopId)
          .maybeSingle();
        resolvedId = row?.id ?? ensured.shopId;
        resolvedName = row?.name ?? null;
        if (ensured.created) {
          toast.success("Boutique créée pour pouvoir enregistrer la charte sur la base.");
        }
      }

      if (!resolvedId) {
        setShopId(null);
        setShopName(null);
        setSaveBlockedReason("no_shop");
        setLoadingShop(false);
        return;
      }

      setShopId(resolvedId);
      setShopName(resolvedName);
      setSaveBlockedReason(null);
      setLoadingShop(false);

      const { data: shopTheme, error: themeError } = await supabase
        .from("shops")
        .select("storefront_theme_key, storefront_theme_overrides")
        .eq("id", resolvedId)
        .maybeSingle();

      if (!alive) return;

      if (themeError) {
        console.error("[DevDaClient] unable to load shop theme columns", themeError);
        const raw = themeError.message ?? "";
        const friendly = formatLayoutSaveError(raw);
        const sqlUrl = isMissingStorefrontLayoutColumn(raw)
          ? getSupabaseSqlEditorUrl()
          : null;
        setShopLoadBanner({ text: friendly, sqlUrl });
        toast.error(
          "Boutique détectée, mais les colonnes thème n’ont pas pu être lues. Valeurs par défaut affichées ; l’enregistrement peut encore échouer tant que le schéma n’est pas à jour."
        );
        setSelectedThemeKey(DEFAULT_CATEGORY_THEME_KEY);
        setOverrides({});
        return;
      }

      if (shopTheme) {
        setSelectedThemeKey(coerceStorefrontThemeKey(shopTheme.storefront_theme_key));
        setOverrides(coerceStorefrontThemeOverrides(shopTheme.storefront_theme_overrides));
      }
    }

    void loadShopThemeEditorContext();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!alive) return;
      if (event === "SIGNED_OUT") {
        setShopId(null);
        setShopName(null);
        setOverrides({});
        setSelectedThemeKey(DEFAULT_CATEGORY_THEME_KEY);
        setShopLoadBanner(null);
        setSaveBlockedReason(null);
        setLoadingShop(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void loadShopThemeEditorContext();
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const currentScale = useMemo(
    () => getStorefrontThemeScaleWithOverrides(selectedThemeKey, overrides),
    [selectedThemeKey, overrides]
  );

  function handleColorChange(
    mode: "light" | "dark",
    field: EditableColorField,
    value: string
  ) {
    setOverrides((prev) => {
      const next: StorefrontThemeOverrides = { ...prev };
      const current = next[selectedThemeKey] ?? {};

      if (field === "primaryBg" || field === "primaryText") {
        const currentButtons = current.buttons ?? {};
        const currentButtonsForMode = currentButtons[mode] ?? {};
        next[selectedThemeKey] = {
          ...current,
          buttons: {
            ...currentButtons,
            [mode]: {
              ...currentButtonsForMode,
              [field]: value,
            },
          },
        };
        return next;
      }

      next[selectedThemeKey] = {
        ...current,
        [mode]: {
          ...(current[mode] ?? {}),
          [field]: value,
        },
      };
      return next;
    });
  }

  function handleResetTheme() {
    setOverrides((prev) => {
      const next: StorefrontThemeOverrides = { ...prev };
      delete next[selectedThemeKey];
      return next;
    });
    toast.success("Palette réinitialisée sur les valeurs par défaut.");
  }

  async function handleSaveOverrides() {
    if (!shopId) {
      toast.error("Aucune boutique liée à ce compte.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("shops")
      .update({
        storefront_theme_key: selectedThemeKey,
        storefront_theme_overrides: overrides,
      })
      .eq("id", shopId);
    setSaving(false);

    if (error) {
      console.error("[DevDaClient] unable to save theme overrides", error);
      const raw = error.message ?? "";
      const friendly = formatLayoutSaveError(raw);
      const sqlUrl = isMissingStorefrontLayoutColumn(raw)
        ? getSupabaseSqlEditorUrl()
        : null;
      if (isMissingStorefrontLayoutColumn(raw) || isShopRowLevelSecurityDenied(raw)) {
        setShopLoadBanner({
          text: friendly,
          sqlUrl: isMissingStorefrontLayoutColumn(raw) ? getSupabaseSqlEditorUrl() : null,
        });
      }
      toast.error(friendly, {
        duration:
          isMissingStorefrontLayoutColumn(raw) || isShopRowLevelSecurityDenied(raw)
            ? 22_000
            : undefined,
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

    setShopLoadBanner(null);
    toast.success("Couleurs enregistrées sur la boutique.");
  }

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

          <div className="space-y-3 rounded-lg border border-border bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Accent vitrine global (tous les thèmes)
            </p>
            <p className="text-xs text-muted-foreground">
              Constantes partagées — tu pourras les brancher plus tard sur les composants
              souhaités (CTA, liens, anneaux de focus, etc.). Les boutons{" "}
              <strong className="font-medium text-foreground">primaires</strong> vitrine restent
              monochrome : noir sur fond clair, blanc sur fond sombre (pas ces bleus).
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="space-y-2">
                <div
                  className="h-16 w-28 rounded-xl border border-border shadow-sm"
                  style={{ backgroundColor: STOREFRONT_GLOBAL_ACCENT_HEX.light }}
                />
                <p className="text-xs font-medium">Mode clair</p>
                <code className="text-[10px] text-muted-foreground">
                  {STOREFRONT_GLOBAL_ACCENT_HEX.light}
                </code>
              </div>
              <div className="space-y-2">
                <div
                  className="h-16 w-28 rounded-xl border border-border shadow-sm"
                  style={{ backgroundColor: STOREFRONT_GLOBAL_ACCENT_HEX.dark }}
                />
                <p className="text-xs font-medium">Mode sombre</p>
                <code className="text-[10px] text-muted-foreground">
                  {STOREFRONT_GLOBAL_ACCENT_HEX.dark}
                </code>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Carte vitrine — clair :{" "}
              <code className="rounded bg-muted px-1">{CATEGORY_THEME_CARD_SEMI}</code>{" "}
              (blanc 70 %). Sombre :{" "}
              <code className="rounded bg-muted px-1">{CATEGORY_THEME_CARD_DARK_SEMI}</code>{" "}
              (#FBFBFB 10 %). Texte des thèmes :{" "}
              <code className="rounded bg-muted px-1">#111111</code> /{" "}
              <code className="rounded bg-muted px-1">#ffffff</code>.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Référence documentaire (CLAUDE.md) : fonds de page marketing type{" "}
            <code className="rounded bg-muted px-1">#faf9f6</code>, texte{" "}
            <code className="rounded bg-muted px-1">#1a1a1a</code> — distincts des tokens
            vitrine ci-dessus. Variables globales :{" "}
            <code className="rounded bg-muted px-1">--color-cream</code>,{" "}
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
                style={{ backgroundColor: "var(--primary)" }}
              >
                Accent
              </div>
              <p className="text-xs font-medium">accent monochrome</p>
              <code className="text-[10px] text-muted-foreground">
                variable adaptée au thème
              </code>
            </div>
          </div>
        </Section>

        <Section
          title="Theme Color Editor"
          description="Editeur de la palette vitrine par theme key, avec enregistrement en base."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  {loadingShop
                    ? "Chargement de la boutique…"
                    : shopId
                      ? `Boutique connectée : ${shopName ?? shopId}`
                      : saveBlockedReason === "guest"
                        ? "Non connecté"
                        : "Aucune boutique liée à ce compte"}
                </p>
                {!loadingShop && !shopId ? (
                  <p className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-foreground">
                    {saveBlockedReason === "guest" ? (
                      <>
                        Le bouton « Reset theme courant » ne modifie que l’aperçu dans le
                        navigateur. Pour enregistrer en base,{" "}
                        <Link
                          href="/login"
                          className="font-medium text-primary underline underline-offset-2"
                        >
                          connectez-vous
                        </Link>{" "}
                        avec le compte propriétaire d’une boutique.
                      </>
                    ) : (
                      <>
                        L’enregistrement nécessite une ligne <code className="rounded bg-muted px-1">shops</code>{" "}
                        pour votre utilisateur. Une création automatique a été tentée ; si le
                        message d’erreur persiste, passez par{" "}
                        <Link
                          href="/onboarding/shop"
                          className="font-medium text-primary underline underline-offset-2"
                        >
                          l’onboarding boutique
                        </Link>{" "}
                        ou le tableau de bord.
                      </>
                    )}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={previewMode === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("light")}
                >
                  Aperçu clair
                </Button>
                <Button
                  type="button"
                  variant={previewMode === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("dark")}
                >
                  Aperçu sombre
                </Button>
              </div>
            </div>

            {shopLoadBanner ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground"
              >
                <p>{shopLoadBanner.text}</p>
                {shopLoadBanner.sqlUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const url = shopLoadBanner.sqlUrl;
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Ouvrir l’éditeur SQL
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_THEME_KEYS.map((key) => {
                const token = CATEGORY_THEME_TOKENS[key];
                const preview = previewMode === "dark" ? token.dark : token.light;
                const selected = key === selectedThemeKey;
                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? "border-[var(--primary)] bg-accent/30"
                        : "border-border hover:bg-muted/30"
                    )}
                    onClick={() => setSelectedThemeKey(key)}
                    aria-pressed={selected}
                  >
                    <p className="font-heading text-sm font-semibold">{token.label}</p>
                    <code className="text-[10px] text-muted-foreground">{key}</code>
                    <span className="mt-2 flex items-center gap-1.5">
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

            <div className="grid gap-4 lg:grid-cols-2">
              <ThemeColorFieldset
                title="Mode clair"
                values={currentScale.light}
                buttonValues={currentScale.buttons.light}
                onColorChange={(field, value) => handleColorChange("light", field, value)}
              />
              <ThemeColorFieldset
                title="Mode sombre"
                values={currentScale.dark}
                buttonValues={currentScale.buttons.dark}
                onColorChange={(field, value) => handleColorChange("dark", field, value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ThemeModeScale
                title="Aperçu Light"
                levels={currentScale.light}
                buttons={{
                  ...CATEGORY_THEME_TOKENS[selectedThemeKey].buttons.light,
                  ...currentScale.buttons.light,
                }}
                titleClassName="text-foreground"
              />
              <ThemeModeScale
                title="Aperçu Dark"
                levels={currentScale.dark}
                buttons={{
                  ...CATEGORY_THEME_TOKENS[selectedThemeKey].buttons.dark,
                  ...currentScale.buttons.dark,
                }}
                titleClassName="text-foreground"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleResetTheme}>
                Reset theme courant
              </Button>
              <Button type="button" onClick={handleSaveOverrides} disabled={!shopId || saving}>
                {saving ? "Enregistrement…" : "Enregistrer en base"}
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Palette catégories (shared tokens)"
          description="Six familles partagées (Neutre, Bleu, Indigo, Emerald, Rose, Ambre), avec niveaux background, surface et carte par thème."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {CATEGORY_THEME_KEYS.map((key) => (
              <CategoryThemeLevelsPreview key={key} themeKey={key} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Source des tokens:{" "}
            <code className="rounded bg-muted px-1">src/lib/categoryThemeTokens.ts</code>.
            Ils seront ensuite réutilisés dans les formulaires catégories et les cartes
            vitrine.
          </p>
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
            <code className="rounded bg-muted px-1">2px solid var(--primary)</code>
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
            <code className="rounded bg-muted px-1">--color-cream</code> #f7f7f7,{" "}
            <code className="rounded bg-muted px-1">--color-charcoal</code> #111111,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent</code> monochrome,{" "}
            <code className="rounded bg-muted px-1">--color-bento-accent-dark</code>{" "}
            monochrome
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

function ThemeColorFieldset({
  title,
  values,
  buttonValues,
  onColorChange,
}: {
  title: string;
  values: {
    background: string;
    surface: string;
    card: string;
    text: string;
  };
  buttonValues: {
    primaryBg: string;
    primaryText: string;
  };
  onColorChange: (
    field: EditableColorField,
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="font-heading text-sm font-semibold">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <ThemeColorInput
          label="background"
          value={values.background}
          onChange={(value) => onColorChange("background", value)}
        />
        <ThemeColorInput
          label="surface"
          value={values.surface}
          onChange={(value) => onColorChange("surface", value)}
        />
        <ThemeColorInput
          label="card"
          value={values.card}
          onChange={(value) => onColorChange("card", value)}
        />
        <ThemeColorInput
          label="text"
          value={values.text}
          onChange={(value) => onColorChange("text", value)}
        />
        <ThemeColorInput
          label="primaryBg"
          value={buttonValues.primaryBg}
          onChange={(value) => onColorChange("primaryBg", value)}
        />
        <ThemeColorInput
          label="primaryText"
          value={buttonValues.primaryText}
          onChange={(value) => onColorChange("primaryText", value)}
        />
      </div>
    </div>
  );
}

function ThemeColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parsed = parseHexWithAlpha(value);
  return (
    <label className="space-y-2 text-xs text-muted-foreground">
      <span className="block font-medium text-foreground">{label}</span>
      <input
        type="color"
        value={parsed.hex}
        onChange={(event) => onChange(composeHexWithAlpha(event.target.value, parsed.alphaPercent))}
        className="h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
      />
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide">Opacité</span>
          <code className="text-[10px]">{parsed.alphaPercent}%</code>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={parsed.alphaPercent}
          onChange={(event) =>
            onChange(composeHexWithAlpha(parsed.hex, Number.parseInt(event.target.value, 10)))
          }
          className="w-full accent-primary"
        />
      </div>
      <code className="block text-[10px]">{value}</code>
    </label>
  );
}

function parseHexWithAlpha(value: string): { hex: string; alphaPercent: number } {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{8}$/.test(normalized)) {
    const hex = normalized.slice(0, 7);
    const alphaHex = normalized.slice(7, 9);
    const alphaPercent = Math.round((Number.parseInt(alphaHex, 16) / 255) * 100);
    return { hex, alphaPercent };
  }
  if (/^#[0-9a-f]{6}$/.test(normalized)) return { hex: normalized, alphaPercent: 100 };
  return { hex: "#111111", alphaPercent: 100 };
}

function composeHexWithAlpha(hex: string, alphaPercent: number): string {
  const normalizedHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : "#111111";
  const clamped = Math.min(100, Math.max(0, alphaPercent));
  if (clamped >= 100) return normalizedHex;
  const alphaHex = Math.round((clamped / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${normalizedHex}${alphaHex}`;
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

function CategoryThemeLevelsPreview({ themeKey }: { themeKey: CategoryThemeKey }) {
  const theme = CATEGORY_THEME_TOKENS[themeKey];
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-semibold">{theme.label}</p>
        <code className="text-[10px] text-muted-foreground">{themeKey}</code>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ThemeModeScale
          title="Light / texte noir"
          levels={theme.light}
          buttons={theme.buttons.light}
          titleClassName="text-foreground"
        />
        <ThemeModeScale
          title="Dark / texte blanc"
          levels={theme.dark}
          buttons={theme.buttons.dark}
          titleClassName="text-foreground"
        />
      </div>
    </div>
  );
}

function ThemeModeScale({
  title,
  levels,
  buttons,
  titleClassName,
}: {
  title: string;
  levels: {
    background: string;
    surface: string;
    card: string;
    text: string;
  };
  buttons: {
    primaryBg: string;
    primaryText: string;
    secondaryBg: string;
    secondaryText: string;
    secondaryBorder: string;
  };
  titleClassName?: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 p-2">
      <p className={cn("text-[11px] font-medium", titleClassName)}>{title}</p>
      <div
        className="rounded-md p-2"
        style={{ backgroundColor: levels.background, color: levels.text }}
      >
        <div
          className="rounded-md p-2"
          style={{ backgroundColor: levels.surface, color: levels.text }}
        >
          <div
            className="rounded-md p-2 text-[11px] font-semibold"
            style={{ backgroundColor: levels.card, color: levels.text }}
          >
            card
          </div>
          <p className="mt-2 text-[10px] font-medium">
            background / surface / card
          </p>
        </div>
      </div>
      <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
        <p>bg: {levels.background}</p>
        <p>surface: {levels.surface}</p>
        <p>card: {levels.card}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: buttons.primaryBg, color: buttons.primaryText }}
          aria-label="Primary icon button sample"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-opacity hover:opacity-90"
          style={{
            backgroundColor: buttons.secondaryBg,
            color: buttons.secondaryText,
            borderColor: buttons.secondaryBorder,
          }}
          aria-label="Secondary icon button sample"
        >
          <Circle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
