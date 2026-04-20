"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useCartStore } from "@/lib/stores/cartStore";
import type { SocialLinks, ShopReviews } from "@/lib/types";

import {
  BentoGrid,
  BENTO_GRID_SURFACE_CLASS,
  BENTO_STAGGER_CONTAINER_VARIANTS,
} from "./BentoGrid";
import { BentoCardInfo } from "./BentoCardInfo";
import { BentoCardCategory } from "./BentoCardCategory";
import { BentoCardBundle } from "./BentoCardBundle";
import { BentoCardGallery } from "./BentoCardGallery";
import { BentoCardBack } from "./BentoCardBack";
import { BentoCardBackFloating } from "./BentoCardBackFloating";
import { BentoCardProduct } from "./BentoCardProduct";
import { BundleDetail } from "./BundleDetail";
import { ProductDetail, type PublicProduct } from "@/components/product/ProductDetail";
import type { BentoSize } from "@/components/bento/BentoCard";
import {
  BUNDLES_MENU_TILE_ID,
  GALLERY_TILE_ID,
  buildDefaultStorefrontLayout,
  mergeStorefrontLayout,
  mobileTileOrder,
  parseStorefrontBentoLayout,
  type StorefrontBentoLayoutItem,
} from "@/lib/storefrontBentoLayout";
import { STOREFRONT_NAVIGATE_HOME } from "@/lib/storefrontNav";
import type { StorefrontPhoto } from "@/lib/types";
import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { getStorefrontThemePreviewStyle, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";
import type { ProductLabelOption } from "@/lib/shop-labels";

// ── Types ──────────────────────────────────────────────────────

export interface ShopInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  phone: string | null;
  /** Email de contact affiché sur la carte boutique. */
  email_contact: string | null;
  social_links: SocialLinks;
  fulfillment_modes?: string[];
  opening_hours?: unknown | null;
  opening_timezone?: string;
  open_on_public_holidays?: boolean;
}

export interface CategoryInfo {
  id: string;
  name: string;
  icon_emoji: string;
  cover_image_url: string | null;
  description: string | null;
  productCount: number;
}

export interface SlotSummary {
  label: string;
  quantity: number;
  categoryName: string;
  categoryEmoji: string;
  categoryId: string;
}

export interface BundleInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  slots: SlotSummary[];
}

interface StoreViewProps {
  shop: ShopInfo;
  categories: CategoryInfo[];
  bundles: BundleInfo[];
  /** Si vrai, une tuile « Menu » regroupe les formules (niveau 1) au lieu d’une tuile par formule. */
  bundlesMenuGrouped?: boolean;
  reviews?: ShopReviews | null;
  storefrontPhotos?: StorefrontPhoto[];
  /** JSON `storefront_bento_layout` depuis Supabase (fusionné avec la carte courante). */
  savedStorefrontLayout?: unknown | null;
  /** Si fourni, remplace le chargement Supabase pour les produits d’une catégorie (ex. démo statique `/demo`). */
  loadCategoryProducts?: (categoryId: string) => Promise<PublicProduct[]>;
  storefrontThemeKey?: CategoryThemeKey;
  storefrontThemeOverrides?: StorefrontThemeOverrides;
  shopLabels?: ProductLabelOption[];
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

const MENU_CARD_NAME = "Menu";
const MENU_CARD_EMOJI = "🍱";
const MENU_CARD_DESCRIPTION = "Choisissez une formule composée.";

/** Remonte la page tout en haut (niveau 2 : éviter le scroll hérité du niveau 1, y compris avec `AnimatePresence mode="wait"`). */
function scrollStorefrontToTop() {
  if (typeof window === "undefined") return;
  const root = document.scrollingElement ?? document.documentElement;
  root.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
}

function scheduleScrollStorefrontToTop() {
  scrollStorefrontToTop();
  queueMicrotask(scrollStorefrontToTop);
  requestAnimationFrame(() => {
    scrollStorefrontToTop();
    requestAnimationFrame(scrollStorefrontToTop);
  });
}

/** Desktop : grille 4 cols + placement x,y,w,h (`omitSizeClasses`). Mobile/tablette : `BentoGrid` + spans comme la démo statique. */
type Level1SizingMode = "explicitGrid" | "bentoCardSpans";

function whToBentoSize(w: number, h: number): BentoSize {
  const cw = Math.min(2, Math.max(1, Math.round(w)));
  const ch = Math.min(2, Math.max(1, Math.round(h)));
  if (cw === 2 && ch === 2) return "2x2";
  if (cw === 2 && ch === 1) return "2x1";
  if (cw === 1 && ch === 2) return "1x2";
  return "1x1";
}

// ── Animation variants ─────────────────────────────────────────

function makeSlideVariants(dir: number) {
  return {
    initial: { x: dir * 60, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
    },
    exit: {
      x: dir * -60,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
    },
  };
}

// ── Component ──────────────────────────────────────────────────

export function StoreView({
  shop,
  categories,
  bundles,
  bundlesMenuGrouped = false,
  reviews,
  storefrontPhotos = [],
  savedStorefrontLayout,
  loadCategoryProducts: loadCategoryProductsProp,
  storefrontThemeKey,
  storefrontThemeOverrides,
  shopLabels = [],
}: StoreViewProps) {
  const isMobile = useIsMobile();
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const isDark = mounted ? resolvedTheme === "dark" : false;
  const storefrontThemeStyle = useMemo(
    () =>
      storefrontThemeKey
        ? getStorefrontThemePreviewStyle(storefrontThemeKey, isDark, storefrontThemeOverrides)
        : undefined,
    [storefrontThemeKey, isDark, storefrontThemeOverrides]
  );
  const addItem = useCartStore((s) => s.addItem);
  const backCardRef = useRef<HTMLDivElement | null>(null);
  const [isBackInView, setIsBackInView] = useState(true);
  /** Après l’anim d’entrée L2 : évite FAB pendant le slide / le chargement (IO instable sans tuile retour). */
  const [l2ScrollFabEnabled, setL2ScrollFabEnabled] = useState(false);

  const visibleStorefrontPhotos = useMemo(
    () => storefrontPhotos.filter((photo) => photo.is_visible),
    [storefrontPhotos]
  );

  const level1Layout = useMemo(() => {
    const built = buildDefaultStorefrontLayout(
      categories.map((c) => c.id),
      bundles.map((b) => b.id),
      { bundlesMenuGrouped, includeGallery: visibleStorefrontPhotos.length > 0 }
    );
    const parsed = parseStorefrontBentoLayout(savedStorefrontLayout);
    return mergeStorefrontLayout(parsed?.lg, built);
  }, [categories, bundles, bundlesMenuGrouped, savedStorefrontLayout, visibleStorefrontPhotos.length]);

  const level1Map = useMemo(() => new Map(level1Layout.map((l) => [l.i, l])), [level1Layout]);

  const [level, setLevel] = useState<"l1" | "l2">("l1");
  const levelRef = useRef<"l1" | "l2">("l1");

  const [direction, setDirection] = useState(1);
  /** Niveau 2 : produits d’une catégorie, ou liste des formules (carte Menu). */
  const [l2View, setL2View] = useState<"category" | "bundles">("category");
  const [selectedCat, setSelectedCat] = useState<CategoryInfo | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [detailProduct, setDetailProduct] = useState<PublicProduct | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<BundleInfo | null>(null);

  // ── Product loader (shared by category nav and bundle detail) ──

  async function loadProductsForCategory(categoryId: string): Promise<PublicProduct[]> {
    if (loadCategoryProductsProp) {
      const list = await loadCategoryProductsProp(categoryId);
      return list.map((p) => ({
        ...p,
        tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
      }));
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, description, price, image_url, tags, option_label, is_available, display_order"
      )
      .eq("category_id", categoryId)
      .eq("is_available", true)
      .order("display_order");
    return (data ?? []).map((p) => ({
      ...p,
      tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    }));
  }

  // ── Navigation ─────────────────────────────────────────────

  async function goToCategory(cat: CategoryInfo) {
    scheduleScrollStorefrontToTop();
    setL2ScrollFabEnabled(false);
    setDirection(1);
    setIsBackInView(true);
    setL2View("category");
    setSelectedCat(cat);
    setProducts([]);
    setLevel("l2");
    setLoadingProducts(true);
    const result = await loadProductsForCategory(cat.id);
    setProducts(result);
    setLoadingProducts(false);
    scheduleScrollStorefrontToTop();
  }

  function goToBundlesMenu() {
    scheduleScrollStorefrontToTop();
    setL2ScrollFabEnabled(false);
    setDirection(1);
    setIsBackInView(true);
    setL2View("bundles");
    setSelectedCat(null);
    setProducts([]);
    setLevel("l2");
    setLoadingProducts(false);
  }

  function goBack() {
    setL2ScrollFabEnabled(false);
    setDirection(-1);
    setLevel("l1");
    setSelectedCat(null);
    setProducts([]);
    setL2View("category");
  }

  const navigateToCategoryRoot = useCallback(() => {
    setDetailProduct(null);
    setSelectedBundle(null);
    setLoadingProducts(false);
    scheduleScrollStorefrontToTop();
    setL2ScrollFabEnabled(false);
    setDirection(-1);
    setLevel("l1");
    setSelectedCat(null);
    setProducts([]);
    setL2View("category");
    scheduleScrollStorefrontToTop();
  }, []);

  useEffect(() => {
    const onHome = () => navigateToCategoryRoot();
    window.addEventListener(STOREFRONT_NAVIGATE_HOME, onHome);
    return () => window.removeEventListener(STOREFRONT_NAVIGATE_HOME, onHome);
  }, [navigateToCategoryRoot]);

  useLayoutEffect(() => {
    levelRef.current = level;
  }, [level]);

  /** À l’entrée en niveau 2 : complète le scroll au clic (après commit / exit L1 sous `AnimatePresence mode="wait"`). */
  useLayoutEffect(() => {
    if (level !== "l2") return;
    scheduleScrollStorefrontToTop();
  }, [level, selectedCat?.id, l2View]);

  useEffect(() => {
    if (!isMobile || level !== "l2") return;
    if (l2View === "category" && loadingProducts) return;
    if (!l2ScrollFabEnabled) return;

    const el = backCardRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        requestAnimationFrame(() => {
          setIsBackInView(entry.isIntersecting);
        });
      },
      { root: null, rootMargin: "0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    isMobile,
    level,
    l2View,
    loadingProducts,
    selectedCat?.id,
    products.length,
    l2ScrollFabEnabled,
  ]);

  const showFloatingBack =
    isMobile &&
    level === "l2" &&
    l2ScrollFabEnabled &&
    !(l2View === "category" && loadingProducts) &&
    !isBackInView;

  // ── Cart ───────────────────────────────────────────────────

  function handleQuickAdd(product: PublicProduct, e: React.MouseEvent) {
    e.stopPropagation();
    if (!product.is_available) return;

    // If product has an option, open detail instead
    if (product.option_label) {
      setDetailProduct(product);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.image_url,
      description: product.description,
      tags: product.tags,
      isBundle: false,
    });
    toast.success(`${product.name} ajouté !`);
  }

  function renderLevel1Tile(item: StorefrontBentoLayoutItem, sizing: Level1SizingMode) {
    const size = whToBentoSize(item.w, item.h);
    const omitSizeClasses = sizing === "explicitGrid";

    if (item.i === "info") {
      return (
        <BentoCardInfo
          cardSize={size}
          omitSizeClasses={omitSizeClasses}
          cardClassName={!omitSizeClasses ? "col-span-2 row-span-2" : undefined}
          shopName={shop.name}
          shopSlug={shop.slug}
          description={shop.description}
          coverUrl={shop.cover_image_url}
          logoUrl={shop.logo_url}
          address={shop.address}
          phone={shop.phone}
          emailContact={shop.email_contact}
          socialLinks={shop.social_links}
          reviews={reviews}
          fulfillmentModes={shop.fulfillment_modes}
          openingHoursJson={shop.opening_hours ?? null}
          openingTimezone={shop.opening_timezone ?? "Europe/Paris"}
          openOnPublicHolidays={shop.open_on_public_holidays ?? false}
        />
      );
    }

    if (item.i.startsWith("category:")) {
      const id = item.i.slice("category:".length);
      const cat = categories.find((c) => c.id === id);
      if (!cat) return null;
      return (
        <BentoCardCategory
          name={cat.name}
          iconEmoji={cat.icon_emoji}
          productCount={cat.productCount}
          coverImageUrl={cat.cover_image_url}
          size={size}
          omitSizeClasses={omitSizeClasses}
          onClick={() => goToCategory(cat)}
        />
      );
    }

    if (item.i === BUNDLES_MENU_TILE_ID) {
      return (
        <BentoCardCategory
          name={MENU_CARD_NAME}
          iconEmoji={MENU_CARD_EMOJI}
          productCount={bundles.length}
          coverImageUrl={null}
          size={size}
          omitSizeClasses={omitSizeClasses}
          onClick={goToBundlesMenu}
        />
      );
    }

    if (item.i.startsWith("bundle:")) {
      const id = item.i.slice("bundle:".length);
      const bundle = bundles.find((b) => b.id === id);
      if (!bundle) return null;
      return (
        <BentoCardBundle
          name={bundle.name}
          description={bundle.description}
          price={bundle.price}
          imageUrl={bundle.image_url}
          slots={bundle.slots}
          size={size}
          omitSizeClasses={omitSizeClasses}
          className={!omitSizeClasses ? "col-span-2 row-span-1" : undefined}
          onClick={() => setSelectedBundle(bundle)}
        />
      );
    }

    if (item.i === GALLERY_TILE_ID) {
      return (
        <BentoCardGallery
          photos={visibleStorefrontPhotos}
          size={size}
          omitSizeClasses={omitSizeClasses}
          className={!omitSizeClasses ? "col-span-2 row-span-1" : undefined}
        />
      );
    }

    return null;
  }

  // ── Render ─────────────────────────────────────────────────

  const slideVars = makeSlideVariants(direction);

  return (
    <div className="bg-background" style={storefrontThemeStyle}>
      <AnimatePresence mode="wait">
        {level === "l1" ? (
          <motion.div
            key="l1"
            initial={slideVars.initial}
            animate={slideVars.animate}
            exit={slideVars.exit}
            className="bg-background"
          >
            <>
              {/* Conteneur variants : sans lui, les BentoCard restent en `itemVariant.hidden` (opacité 0). */}
              <motion.div
                variants={BENTO_STAGGER_CONTAINER_VARIANTS}
                initial="hidden"
                animate="show"
                className={cn("hidden lg:grid grid-cols-4", BENTO_GRID_SURFACE_CLASS)}
              >
                {level1Layout.map((item) => (
                  <div
                    key={item.i}
                    style={{
                      gridColumn: `${item.x + 1} / span ${item.w}`,
                      gridRow: `${item.y + 1} / span ${item.h}`,
                    }}
                    className="min-h-0 min-w-0"
                  >
                    {renderLevel1Tile(item, "explicitGrid")}
                  </div>
                ))}
              </motion.div>

              <BentoGrid className="lg:hidden grid-cols-2">
                {mobileTileOrder(level1Layout).map((tileId) => {
                  const item = level1Map.get(tileId);
                  if (!item) return null;
                  return (
                    <Fragment key={tileId}>{renderLevel1Tile(item, "bentoCardSpans")}</Fragment>
                  );
                })}
              </BentoGrid>
            </>
          </motion.div>
        ) : (
          <motion.div
            key={l2View === "bundles" ? "l2-bundles" : `l2-cat-${selectedCat?.id ?? ""}`}
            initial={slideVars.initial}
            animate={slideVars.animate}
            exit={slideVars.exit}
            className="bg-background"
            onAnimationComplete={() => {
              scheduleScrollStorefrontToTop();
              if (levelRef.current === "l2") {
                setL2ScrollFabEnabled(true);
                setIsBackInView(true);
              }
            }}
          >
            {l2View === "category" && loadingProducts ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <BentoGrid>
                <BentoCardBack
                  ref={backCardRef}
                  categoryName={
                    l2View === "bundles" ? MENU_CARD_NAME : (selectedCat?.name ?? "")
                  }
                  categoryEmoji={
                    l2View === "bundles" ? MENU_CARD_EMOJI : (selectedCat?.icon_emoji ?? "")
                  }
                  description={
                    l2View === "bundles" ? MENU_CARD_DESCRIPTION : selectedCat?.description
                  }
                  onBack={goBack}
                />

                {l2View === "category" &&
                  products.map((p) => (
                    <BentoCardProduct
                      key={p.id}
                      name={p.name}
                      price={p.price}
                      imageUrl={p.image_url}
                      fallbackEmoji={selectedCat?.icon_emoji}
                      tags={p.tags}
                      shopLabels={shopLabels}
                      isAvailable={p.is_available}
                      onAddToCart={(e) => handleQuickAdd(p, e)}
                      onClick={() => setDetailProduct(p)}
                    />
                  ))}

                {l2View === "bundles" &&
                  bundles.map((b) => (
                    <BentoCardBundle
                      key={b.id}
                      name={b.name}
                      description={b.description}
                      price={b.price}
                      imageUrl={b.image_url}
                      slots={b.slots}
                      size="2x1"
                      onClick={() => setSelectedBundle(b)}
                    />
                  ))}

                {l2View === "category" && products.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <span className="text-4xl">{selectedCat?.icon_emoji}</span>
                    <p>Aucun produit disponible dans cette catégorie.</p>
                  </div>
                )}

                {l2View === "bundles" && bundles.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
                    <span className="text-4xl">{MENU_CARD_EMOJI}</span>
                    <p>Aucune formule disponible pour le moment.</p>
                  </div>
                )}
              </BentoGrid>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ProductDetail
        product={detailProduct}
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        shopLabels={shopLabels}
      />

      <BundleDetail
        bundle={selectedBundle}
        open={!!selectedBundle}
        onClose={() => setSelectedBundle(null)}
        loadCategoryProducts={loadProductsForCategory}
        shopLabels={shopLabels}
      />

      <BentoCardBackFloating
        open={showFloatingBack}
        categoryName={
          l2View === "bundles" ? MENU_CARD_NAME : (selectedCat?.name ?? "")
        }
        categoryEmoji={
          l2View === "bundles" ? MENU_CARD_EMOJI : (selectedCat?.icon_emoji ?? "")
        }
        description={
          l2View === "bundles" ? MENU_CARD_DESCRIPTION : selectedCat?.description
        }
        onBack={goBack}
      />
    </div>
  );
}
