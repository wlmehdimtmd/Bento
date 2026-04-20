import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingCart, TrendingUp, FolderOpen } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { SHOP_TYPES } from "@/lib/constants";

type Params = Promise<{ shopId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("name").eq("id", shopId).single();
  return { title: data?.name ?? "Boutique" };
}

export default async function ShopDashboardPage({ params }: { params: Params }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .eq("owner_id", user.id)
    .single();

  if (!shop) notFound();

  const typeLabel = SHOP_TYPES.find((t) => t.value === shop.type)?.label ?? shop.type;

  const { data: cats } = await supabase.from("categories").select("id").eq("shop_id", shopId);
  let productCount = 0;
  if (cats && cats.length > 0) {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .in("category_id", cats.map((c) => c.id));
    productCount = count ?? 0;
  }

  const { count: catCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId);

  const { data: orders, count: orderCount } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, total_amount, status, created_at", { count: "exact" })
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(5);

  const revenue = (orders ?? []).reduce(
    (sum, o) => (o.status !== "cancelled" ? sum + Number(o.total_amount) : sum),
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
            {shop.logo_url ? (
              <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl">🍱</span>
            )}
          </div>
          <div className="min-w-0">
            <h1
              className="text-2xl font-bold truncate"
              style={{ fontFamily: "var(--font-onest)" }}
            >
              {shop.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">/{shop.slug}</span>
              <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
              <Badge
                variant="outline"
                className={
                  shop.is_active
                    ? "text-emerald-600 border-emerald-500/50 text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {shop.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={<FolderOpen className="h-5 w-5" />} label="Catégories" value={catCount ?? 0} iconColor="bg-amber-500 text-white" />
        <StatsCard icon={<Package className="h-5 w-5" />} label="Produits" value={productCount} iconColor="bg-violet-500 text-white" />
        <StatsCard icon={<ShoppingCart className="h-5 w-5" />} label="Commandes" value={orderCount ?? 0} iconColor="bg-blue-500 text-white" />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Chiffre d'affaires" value={revenue} type="currency" iconColor="bg-primary text-primary-foreground dark:bg-[oklch(0.205_0_0)] dark:text-[oklch(0.985_0_0)]" />
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actions rapides</h2>
        <QuickActions shopSlug={shop.slug} shopId={shop.id} />
      </div>

      {/* Recent orders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dernières commandes</h2>
          <Link href="/dashboard/orders" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Voir tout
          </Link>
        </div>
        <RecentOrders orders={orders ?? []} />
      </div>
    </div>
  );
}
