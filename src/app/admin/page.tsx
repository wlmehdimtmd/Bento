import Link from "next/link";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { DEMO_TEMPLATE_SHOP_SLUG } from "@/lib/demoTemplateShop";
import { normalizeShopOwner } from "@/lib/admin/normalizeShopUser";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminDemoBanner } from "./AdminDemoBanner";
import { AdminShopsDesktopTable } from "./AdminShopsDesktopTable";
import { AdminShopsMobileList, type AdminShopMobileRow } from "./AdminShopsMobileList";

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

  const templateShop = shopRows.find((s) => s.slug === DEMO_TEMPLATE_SHOP_SLUG) ?? null;

  const demoSourceId =
    configuredDemoId ?? (templateShop?.is_active ? templateShop.id : null);

  const demoShop = demoSourceId ? (shopRows.find((s) => s.id === demoSourceId) ?? null) : null;

  const demoOwner = demoShop ? normalizeShopOwner(demoShop.users) : null;

  const tableShops = shopRows.filter((s) => s.slug !== DEMO_TEMPLATE_SHOP_SLUG);

  const shopIds = shopRows.map((s) => s.id);
  const { data: reviewRows } = shopIds.length
    ? await service
        .from("shop_reviews")
        .select(
          "shop_id, google_enabled, google_last_fetched, tripadvisor_enabled, tripadvisor_last_fetched"
        )
        .in("shop_id", shopIds)
    : { data: [] };

  const reviewMap = Object.fromEntries((reviewRows ?? []).map((r) => [r.shop_id, r]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const adminRows: AdminShopMobileRow[] = tableShops.map((shop) => {
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

  const n = tableShops.length;
  const hasTpl = !!templateShop;
  let subtitle: string;
  if (shopRows.length === 0) {
    subtitle = "Aucune boutique en base — la carte démo /demo reste disponible";
  } else if (n === 0 && !hasTpl) {
    subtitle = "Uniquement la vitrine modèle réservée (hors tableau)";
  } else if (n === 0 && hasTpl) {
    subtitle = "Boutique modèle réservée (hors tableau) ; aucune autre vitrine";
  } else if (n === 1 && !hasTpl) {
    subtitle = "1 boutique + vitrine /demo (carte ci-dessus)";
  } else if (hasTpl) {
    subtitle = `${n} vitrine(s) + modèle démo réservé ; source /demo dans la carte ci-dessus`;
  } else {
    subtitle = `${n} boutiques ; source /demo dans la carte ci-dessus`;
  }

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              Admin — Boutiques
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/admin/shops/new"
              className={cn(buttonVariants(), "text-primary-foreground hover:opacity-90")}
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle boutique
            </Link>
            <AdminLogoutButton />
          </div>
        </div>

        <AdminDemoBanner
          demoShop={demoShop ? { id: demoShop.id, name: demoShop.name, slug: demoShop.slug } : null}
          demoOwner={demoOwner}
          configuredDemoId={configuredDemoId}
          appUrl={appUrl}
        />

        {shopRows.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Aucune entrée dans <span className="font-mono">shops</span>. Créez une boutique ou
            inscrivez un utilisateur pour commencer.
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
