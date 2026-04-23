"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { MerchantDashboardShell } from "./MerchantDashboardShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface DashboardLayoutProps {
  shops: { id: string; name: string }[];
  /** Commandes à traiter (hors livrées / annulées), pour le badge « Commandes ». */
  activeOrdersCount?: number;
  isAdmin?: boolean;
  disableAutoLogout?: boolean;
  autoLogoutTimeoutMinutes?: number;
  children: React.ReactNode;
}

const INACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
];

export function DashboardLayout({
  shops,
  activeOrdersCount = 0,
  isAdmin = false,
  disableAutoLogout = false,
  autoLogoutTimeoutMinutes = 15,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
     
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (disableAutoLogout) return;

    const timeoutMinutes = [5, 10, 15, 30, 60].includes(autoLogoutTimeoutMinutes)
      ? autoLogoutTimeoutMinutes
      : 15;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timeoutId: number | null = null;
    let isLoggingOut = false;

    const triggerAutoLogout = async () => {
      if (isLoggingOut) return;
      isLoggingOut = true;
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (error) {
        console.error("[dashboard] auto-logout request failed", error);
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "global" });
      } finally {
        router.push("/login");
      }
    };

    const resetInactivityTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        void triggerAutoLogout();
      }, timeoutMs);
    };

    INACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    document.addEventListener("visibilitychange", resetInactivityTimer);
    resetInactivityTimer();

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      INACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
      document.removeEventListener("visibilitychange", resetInactivityTimer);
    };
  }, [autoLogoutTimeoutMinutes, disableAutoLogout, router]);

  return (
    <MerchantDashboardShell className="flex min-h-screen">
      {/* Desktop sidebar */}
      <DashboardSidebar shops={shops} activeOrdersCount={activeOrdersCount} isAdmin={isAdmin} />

      {/* Mobile sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-[85%] min-w-[280px] max-w-none sm:max-w-none sm:w-[85%]"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar
            shops={shops}
            activeOrdersCount={activeOrdersCount}
            isAdmin={isAdmin}
            forSheet
          />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 bg-card">
        {/* Mobile top header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b border-border px-4 bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={tr("Ouvrir le menu", "Open menu")}
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            🍱 Bento Resto
          </span>
          <span className="w-10 shrink-0" aria-hidden />
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-card">
          {children}
        </main>
      </div>
    </MerchantDashboardShell>
  );
}
