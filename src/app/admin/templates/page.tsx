import Link from "next/link";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { AdminTemplatesClient } from "./AdminTemplatesClient";
import { AdminLogoutButton } from "@/app/admin/AdminLogoutButton";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Admin — Templates" };

export default async function AdminTemplatesPage() {
  const service = await assertAdminOrRedirect();

  /* Tables templates absentes des types Supabase générés */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- requêtes admin sur schéma étendu
  const db: any = service;
  const [btRes, catRes, prodRes, bundleRes, slotRes] = await Promise.all([
    db.from("business_types").select("*").order("position"),
    db.from("category_templates").select("*").order("position"),
    db.from("product_templates").select("*").order("position"),
    db.from("bundle_templates").select("*").order("position"),
    db.from("bundle_template_slots").select("*").order("position"),
  ]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Admin
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              Templates
            </h1>
          </div>
          <AdminLogoutButton />
        </div>

        <AdminTemplatesClient
          initialBusinessTypes={btRes.data ?? []}
          initialCategories={catRes.data ?? []}
          initialProducts={prodRes.data ?? []}
          initialBundles={bundleRes.data ?? []}
          initialSlots={slotRes.data ?? []}
        />
      </div>
    </div>
  );
}
