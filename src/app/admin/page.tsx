import { publicAppUrl } from "@/lib/publicAppUrl";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { normalizeShopOwner } from "@/lib/admin/normalizeShopUser";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminDemoBanner } from "./AdminDemoBanner";
import { AdminShopsDesktopTable } from "./AdminShopsDesktopTable";
import { AdminShopsMobileList, type AdminShopMobileRow } from "./AdminShopsMobileList";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin — Toutes les boutiques" };

type ShopListRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  users: unknown;
};

export default async function AdminPage() {
  const service = await assertAdminOrRedirect();

  const [{ data: shops }, { data: platformRow, error: platformErr }] = await Promise.all([
    service
      .from("shops")
      .select("id, name, slug, is_active, created_at, owner_id, users(email, full_name)")
      .order("created_at", { ascending: false }),
    service.from("platform_settings").select("demo_shop_id").eq("id", "default").maybeSingle(),
  ]);

  const shopRows = (shops ?? []) as ShopListRow[];

  const configuredDemoId =
    !platformErr && platformRow
      ? (platformRow as { demo_shop_id: string | null }).demo_shop_id
      : null;

  const mirroredShop =
    configuredDemoId != null ? (shopRows.find((s) => s.id === configuredDemoId) ?? null) : null;

  const shopIds = shopRows.map((s) => s.id);
  const { data: reviewRows } = shopIds.length
    ? await service
        .from("shop_reviews")
        .select("shop_id, tripadvisor_enabled, tripadvisor_last_fetched")
        .in("shop_id", shopIds)
    : { data: [] };

  const reviewMap = Object.fromEntries((reviewRows ?? []).map((r) => [r.shop_id, r]));

  const appUrl = publicAppUrl;

  const adminRows: AdminShopMobileRow[] = shopRows.map((shop) => {
    const owner = normalizeShopOwner(shop.users);
    const rev = reviewMap[shop.id] as AdminShopMobileRow["rev"];
    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      is_active: shop.is_active,
      created_at: shop.created_at,
      ownerEmail: owner?.email ?? null,
      ownerFullName: owner?.full_name ?? null,
      shopUrl: `${appUrl}/${shop.slug}`,
      rev,
    };
  });

  const n = shopRows.length;
  let subtitle: string;
  if (n === 0) {
    subtitle = "Aucune boutique en base — /demo reste disponible en démo intégrée";
  } else if (n === 1) {
    subtitle = "1 boutique ; raccourcis /demo ci-dessous";
  } else {
    subtitle = `${n} boutiques ; raccourcis /demo ci-dessous`;
  }

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mb-3 inline-flex items-center gap-1.5"
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Dashboard vitrine
            </Link>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              Admin — Boutiques
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <AdminLogoutButton />
          </div>
        </div>

        <AdminDemoBanner
          appUrl={appUrl}
          configuredDemoId={configuredDemoId}
          mirroredShop={
            mirroredShop
              ? { name: mirroredShop.name, slug: mirroredShop.slug, isActive: mirroredShop.is_active }
              : null
          }
        />

        {shopRows.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Aucune entrée dans <span className="font-mono">shops</span>. Les boutiques sont créées
            lors de l&apos;inscription commerçant.
          </p>
        ) : null}

        <section className="space-y-3" aria-labelledby="shops-table-heading">
          <h2 id="shops-table-heading" className="text-base font-semibold" style={{ fontFamily: "var(--font-onest)" }}>
            Boutiques gérées
          </h2>
          <div className="hidden md:block">
            <AdminShopsDesktopTable rows={adminRows} />
          </div>
          <AdminShopsMobileList rows={adminRows} className="md:hidden" />
        </section>
      </div>
    </div>
  );
}
