import Link from "next/link";
import { Package, ShoppingCart, TrendingUp, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
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
            Bienvenue sur Bento Resto !
          </h2>
          <p className="text-muted-foreground max-w-md">
            Votre boutique est activée par l&apos;équipe Bento. Une fois votre compte associé à une
            vitrine, vous retrouverez ici le tableau de bord et vos commandes.
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
          Tableau de bord
        </h1>
        {primaryShop && (
          <p className="mt-1 text-sm text-muted-foreground">{primaryShop.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={<Package className="h-5 w-5" />}
          label="Produits actifs"
          value={productCount}
          iconColor="bg-violet-500"
        />
        <StatsCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Commandes totales"
          value={orderCount}
          iconColor="bg-blue-500"
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Chiffre d'affaires"
          value={revenue}
          type="currency"
          iconColor="bg-[var(--color-bento-accent)]"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Actions rapides
        </h2>
        <QuickActions shopSlug={primaryShop?.slug} shopId={primaryShop?.id} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dernières commandes
          </h2>
          <Link
            href="/dashboard/orders"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Voir tout
          </Link>
        </div>
        <RecentOrders orders={recentOrders} />
      </div>
    </div>
  );
}
