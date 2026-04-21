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
  forSheet = false,
}: {
  shops: { id: string; name: string }[];
  activeOrdersCount?: number;
  className?: string;
  /** Panneau mobile : largeur généreuse + cibles type bouton `size="lg"`. */
  forSheet?: boolean;
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

  const navItemClass = forSheet
    ? "min-h-[52px] gap-2 px-6 text-base"
    : "gap-3 px-3 py-2.5 text-sm";
  const navSubItemClass = forSheet
    ? "min-h-[48px] gap-2 px-6 py-3 text-base"
    : "gap-3 px-3 py-2 text-sm";
  const iconClass = forSheet ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0";
  const chevronClass = forSheet ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0";

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
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border shrink-0",
          forSheet ? "h-[52px] px-6" : "h-16 px-6"
        )}
      >
        <span
          className={cn("font-bold tracking-tight", forSheet ? "text-2xl" : "text-xl")}
          style={{ fontFamily: "var(--font-onest)" }}
        >
          🍱 Bento Resto
        </span>
      </div>

      <nav className={cn("flex-1 min-h-0 space-y-1 overflow-y-auto py-4", forSheet ? "px-2" : "px-3")}>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center rounded-lg font-medium transition-colors",
            navItemClass,
            isActive("/dashboard", true)
              ? activeItemClass
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className={iconClass} />
          {tr("Tableau de bord", "Dashboard")}
        </Link>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setVitrineOpen((o) => !o)}
            aria-expanded={vitrineOpen}
            className={cn(
              "flex w-full items-center rounded-lg font-medium transition-colors",
              navItemClass,
              vitrineGroupActive && !vitrineOpen
                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Store className={iconClass} />
            <span className="flex-1 text-left">{tr("Modifier ma vitrine", "Edit storefront")}</span>
            <ChevronDown
              className={cn(chevronClass, "transition-transform", vitrineOpen && "rotate-180")}
            />
          </button>

          {vitrineOpen ? (
            <div className={cn("mt-1 border-l border-sidebar-border", forSheet ? "ml-3 space-y-1 pl-3" : "ml-4 space-y-0.5 pl-2")}>
              <Link
                href={vitrineConfigHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(vitrineConfigHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <SlidersHorizontal className={iconClass} />
                {tr("Configuration vitrine", "Storefront settings")}
              </Link>
              <Link
                href={vitrineLayoutHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(vitrineLayoutHref) || pathname.includes("/bento")
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <LayoutGrid className={iconClass} />
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
              "flex w-full items-center rounded-lg font-medium transition-colors",
              navItemClass,
              carteGroupActive && !carteOpen
                ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Package className={iconClass} />
            <span className="flex-1 text-left">{tr("Ma carte", "My menu")}</span>
            <ChevronDown
              className={cn(chevronClass, "transition-transform", carteOpen && "rotate-180")}
            />
          </button>

          {carteOpen ? (
            <div className={cn("mt-1 border-l border-sidebar-border", forSheet ? "ml-3 space-y-1 pl-3" : "ml-4 space-y-0.5 pl-2")}>
              <Link
                href={categoriesHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(categoriesHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <FolderOpen className={iconClass} />
                {tr("Catégories", "Categories")}
              </Link>
              <Link
                href={productsHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(productsHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Package className={iconClass} />
                {tr("Produits", "Products")}
              </Link>
              <Link
                href={bundlesHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(bundlesHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Gift className={iconClass} />
                {tr("Formules", "Bundles")}
              </Link>
              <Link
                href={labelsHref}
                className={cn(
                  "flex items-center rounded-lg font-medium transition-colors",
                  navSubItemClass,
                  isActive(labelsHref)
                    ? activeItemClass
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Tags className={iconClass} />
                {tr("Labels", "Labels")}
              </Link>
            </div>
          ) : null}
        </div>

        <Link
          href={ordersHref}
          className={cn(
            "flex items-center rounded-lg font-medium transition-colors",
            navItemClass,
            isActive(ordersHref)
              ? activeItemClass
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <ShoppingCart className={iconClass} />
          <span className="flex-1 text-left">{tr("Commandes", "Orders")}</span>
          {activeOrdersCount > 0 ? (
            <span
              className={cn(
                "flex min-w-5 items-center justify-center rounded-full font-bold tabular-nums leading-none",
                forSheet ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]",
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

      <div className={cn("border-t border-sidebar-border shrink-0 py-3 space-y-2", forSheet ? "px-2" : "px-3")}>
        {contextualShopName ? (
          <p
            className={cn(
              "font-medium text-muted-foreground truncate",
              forSheet ? "px-6 text-sm" : "px-3 text-xs"
            )}
            title={contextualShopName}
          >
            {contextualShopName}
          </p>
        ) : null}

        <Link
          href={settingsHref}
          className={cn(
            "flex items-center rounded-lg font-medium transition-colors",
            navItemClass,
            settingsActive
              ? activeItemClass
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={iconClass} />
          {tr("Paramètres", "Settings")}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center rounded-lg font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            navItemClass
          )}
        >
          <LogOut className={iconClass} />
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
      <SidebarColumn
        shops={shops}
        activeOrdersCount={activeOrdersCount}
        className="h-full"
        forSheet
      />
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-[260px] md:shrink-0 h-screen sticky top-0 border-r border-sidebar-border">
      <SidebarColumn shops={shops} activeOrdersCount={activeOrdersCount} className="h-full" />
    </aside>
  );
}
