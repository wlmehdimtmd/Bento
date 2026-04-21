"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  ShoppingCart,
  Gift,
  Settings,
  LogOut,
  ChevronDown,
  LayoutGrid,
  SlidersHorizontal,
  Store,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface DashboardSidebarProps {
  user: { email: string; full_name?: string | null };
  shops: { id: string; name: string }[];
  /** Commandes actives (pending → ready), toutes boutiques du compte. */
  activeOrdersCount?: number;
  /** Contenu identique au desktop, pour le panneau latéral mobile (drawer). */
  forSheet?: boolean;
}

function parseShopIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/dashboard\/shops\/([^/]+)/);
  if (!m) return null;
  const id = m[1];
  if (id === "new") return null;
  return id;
}

function SidebarColumn({
  shops,
  activeOrdersCount = 0,
  className,
}: {
  shops: { id: string; name: string }[];
  activeOrdersCount?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();

  const routeShopId = useMemo(() => parseShopIdFromPath(pathname), [pathname]);
  const firstShopId = shops[0]?.id ?? null;
  const effectiveShopId = routeShopId ?? firstShopId;

  const categoriesHref = routeShopId
    ? `/dashboard/shops/${routeShopId}/categories`
    : "/dashboard/categories";

  const productsHref = routeShopId
    ? `/dashboard/shops/${routeShopId}/products`
    : "/dashboard/products";

  const bundlesHref = routeShopId
    ? `/dashboard/shops/${routeShopId}/bundles`
    : "/dashboard/bundles";

  const labelsHref = routeShopId
    ? `/dashboard/shops/${routeShopId}/labels`
    : "/dashboard/labels";

  const vitrineConfigHref = effectiveShopId
    ? `/dashboard/shops/${effectiveShopId}/settings`
    : "/dashboard";

  const vitrineLayoutHref = effectiveShopId
    ? `/dashboard/shops/${effectiveShopId}/vitrine/mise-en-page`
    : "/dashboard/vitrine/mise-en-page";

  const ordersHref = effectiveShopId
    ? `/dashboard/shops/${effectiveShopId}/orders`
    : "/dashboard/orders";

  const settingsHref = "/dashboard/settings";

  const contextualShopName = useMemo(() => {
    if (routeShopId) {
      return shops.find((s) => s.id === routeShopId)?.name ?? null;
    }
    return shops[0]?.name ?? null;
  }, [routeShopId, shops]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const settingsActive = pathname === settingsHref || pathname.startsWith(`${settingsHref}/`);
  const activeItemClass =
    "bg-[var(--primary)] [color:var(--primary-foreground)]";

  const carteChildHrefs = [categoriesHref, productsHref, bundlesHref, labelsHref];
  const carteGroupActive = carteChildHrefs.some((h) => isActive(h));
  const vitrineChildHrefs = [vitrineConfigHref, vitrineLayoutHref];
  const vitrineGroupActive =
    vitrineChildHrefs.some((h) => isActive(h)) ||
    pathname.includes("/bento") ||
    pathname.includes("/vitrine/mise-en-page");

  const [carteOpen, setCarteOpen] = useState(true);
  const [vitrineOpen, setVitrineOpen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (carteGroupActive) setCarteOpen(true);
  }, [carteGroupActive]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (vitrineGroupActive) setVitrineOpen(true);
  }, [vitrineGroupActive]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className={cn("flex flex-col min-h-0 overflow-hidden bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border shrink-0">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          🍱 Bento Resto
        </span>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive("/dashboard", true)
              ? activeItemClass
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {tr("Tableau de bord", "Dashboard")}
        </Link>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setVitrineOpen((o) => !o)}
            aria-expanded={vitrineOpen}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              vitrineGroupActive && !vitrineOpen
                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Store className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{tr("Modifier ma vitrine", "Edit storefront")}</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 transition-transform", vitrineOpen && "rotate-180")}
            />
          </button>

          {vitrineOpen ? (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
              <Link
                href={vitrineConfigHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(vitrineConfigHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                {tr("Configuration vitrine", "Storefront settings")}
              </Link>
              <Link
                href={vitrineLayoutHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(vitrineLayoutHref) || pathname.includes("/bento")
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                {tr("Mise en page vitrine", "Storefront layout")}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCarteOpen((o) => !o)}
            aria-expanded={carteOpen}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              carteGroupActive && !carteOpen
                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{tr("Ma carte", "My menu")}</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 transition-transform", carteOpen && "rotate-180")}
            />
          </button>

          {carteOpen ? (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
              <Link
                href={categoriesHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(categoriesHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                {tr("Catégories", "Categories")}
              </Link>
              <Link
                href={productsHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(productsHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Package className="h-4 w-4 shrink-0" />
                {tr("Produits", "Products")}
              </Link>
              <Link
                href={bundlesHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(bundlesHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Gift className="h-4 w-4 shrink-0" />
                {tr("Formules", "Bundles")}
              </Link>
              <Link
                href={labelsHref}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(labelsHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Tags className="h-4 w-4 shrink-0" />
                {tr("Labels", "Labels")}
              </Link>
            </div>
          ) : null}
        </div>

        <Link
          href={ordersHref}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(ordersHref)
              ? activeItemClass
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <ShoppingCart className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{tr("Commandes", "Orders")}</span>
          {activeOrdersCount > 0 ? (
            <span
              className={cn(
                "flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none",
                isActive(ordersHref)
                  ? "bg-white/20 text-white"
                  : "bg-[var(--primary)] text-white"
              )}
              aria-label={
                locale === "en"
                  ? `${activeOrdersCount} order${activeOrdersCount > 1 ? "s" : ""} to process`
                  : `${activeOrdersCount} commande${activeOrdersCount > 1 ? "s" : ""} à traiter`
              }
            >
              {activeOrdersCount > 99 ? "99+" : activeOrdersCount}
            </span>
          ) : null}
        </Link>
      </nav>

      <div className="border-t border-sidebar-border shrink-0 px-3 py-3 space-y-2">
        {contextualShopName ? (
          <p
            className="px-3 text-xs font-medium text-muted-foreground truncate"
            title={contextualShopName}
          >
            {contextualShopName}
          </p>
        ) : null}

        <Link
          href={settingsHref}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            settingsActive
              ? activeItemClass
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {tr("Paramètres", "Settings")}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {tr("Se déconnecter", "Log out")}
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  user: _user,
  shops,
  activeOrdersCount = 0,
  forSheet,
}: DashboardSidebarProps) {
  if (forSheet) {
    return (
      <SidebarColumn shops={shops} activeOrdersCount={activeOrdersCount} className="h-full" />
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-[260px] md:shrink-0 h-screen sticky top-0 border-r border-sidebar-border">
      <SidebarColumn shops={shops} activeOrdersCount={activeOrdersCount} className="h-full" />
    </aside>
  );
}
