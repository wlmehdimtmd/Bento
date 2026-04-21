import Link from "next/link";
import { cookies } from "next/headers";
import { Package, ShoppingCart, TrendingUp, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/lib/i18n";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, is_active")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const hasShops = (shops?.length ?? 0) > 0;
  const primaryShop = shops?.[0];

  let productCount = 0;
  let orderCount = 0;
  let revenue = 0;
  let recentOrders: {
    id: string;
    order_number: number;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[] = [];

  if (primaryShop) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .eq("shop_id", primaryShop.id);

    if (cats && cats.length > 0) {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .in("category_id", cats.map((c) => c.id));
      productCount = count ?? 0;
    }

    const { data: orders, count } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, total_amount, status, created_at", {
        count: "exact",
      })
      .eq("shop_id", primaryShop.id)
      .order("created_at", { ascending: false })
      .limit(5);

    orderCount = count ?? 0;
    recentOrders = orders ?? [];
    revenue = (orders ?? []).reduce(
      (sum, o) => (o.status !== "cancelled" ? sum + Number(o.total_amount) : sum),
      0
    );
  }

  if (!hasShops) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-muted p-6">
          <Store className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-onest)" }}
          >
            {tr("Bienvenue sur Bento Resto !", "Welcome to Bento Resto!")}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {tr(
              "Votre boutique est activée par l'équipe Bento. Une fois votre compte associé à une vitrine, vous retrouverez ici le tableau de bord et vos commandes.",
              "Your shop is activated by the Bento team. Once your account is linked to a storefront, your dashboard and orders will appear here."
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-onest)" }}
        >
          {tr("Tableau de bord", "Dashboard")}
        </h1>
        {primaryShop && (
          <p className="mt-1 text-sm text-muted-foreground">{primaryShop.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={<Package className="h-5 w-5" />}
          label={tr("Produits actifs", "Active products")}
          value={productCount}
          iconColor="bg-violet-500 text-white"
        />
        <StatsCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label={tr("Commandes totales", "Total orders")}
          value={orderCount}
          iconColor="bg-blue-500 text-white"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={tr("Chiffre d'affaires", "Revenue")}
          value={revenue}
          type="currency"
          iconColor="bg-primary text-primary-foreground dark:bg-[oklch(0.205_0_0)] dark:text-[oklch(0.985_0_0)]"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {tr("Actions rapides", "Quick actions")}
        </h2>
        <QuickActions shopSlug={primaryShop?.slug} shopId={primaryShop?.id} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {tr("Dernières commandes", "Latest orders")}
          </h2>
          <Link
            href="/dashboard/orders"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {tr("Voir tout", "View all")}
          </Link>
        </div>
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  );
}
