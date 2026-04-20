import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

const TABS = [
  { label: "Catégories", href: (id: string) => `/admin/shops/${id}/manage/categories` },
  { label: "Produits", href: (id: string) => `/admin/shops/${id}/manage/products` },
  { label: "Formules", href: (id: string) => `/admin/shops/${id}/manage/bundles` },
  { label: "Commandes", href: (id: string) => `/admin/shops/${id}/manage/orders` },
];

export default async function AdminManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { id } = await params;

  const service = await assertAdminOrRedirect();
  const { data: shop } = await service
    .from("shops")
    .select("id, name, slug")
    .eq("id", id)
    .single();

  if (!shop) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-8 py-4">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              {shop.name}
            </h1>
            <p className="text-xs text-muted-foreground">/{shop.slug}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl mt-4 flex gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href(id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-8">{children}</div>
    </div>
  );
}
