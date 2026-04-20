"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "./DashboardSidebar";
import { MerchantDashboardShell } from "./MerchantDashboardShell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  user: { email: string; full_name?: string | null };
  shops: { id: string; name: string }[];
  /** Commandes à traiter (hors livrées / annulées), pour le badge « Commandes ». */
  activeOrdersCount?: number;
  children: React.ReactNode;
}

export function DashboardLayout({ user, shops, activeOrdersCount = 0, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <MerchantDashboardShell className="flex min-h-screen">
      {/* Desktop sidebar */}
      <DashboardSidebar user={user} shops={shops} activeOrdersCount={activeOrdersCount} />

      {/* Mobile sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar user={user} shops={shops} activeOrdersCount={activeOrdersCount} forSheet />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 bg-card">
        {/* Mobile top header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b border-border px-4 bg-card shrink-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ouvrir le menu"
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
