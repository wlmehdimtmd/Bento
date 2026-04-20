import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { normalizeShopOwner } from "@/lib/admin/normalizeShopUser";
import { buttonVariants } from "@/components/ui/button";
import { updateShopAdmin } from "@/app/admin/actions";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Admin — Éditer la boutique" };

export default async function AdminEditShopPage({ params }: { params: Params }) {
  const { id } = await params;
  const service = await assertAdminOrRedirect();
  const { data: shop } = await service
    .from("shops")
    .select("id, name, slug, description, address, phone, email_contact, is_active, users(email, full_name)")
    .eq("id", id)
    .single();

  if (!shop) notFound();

  const owner = normalizeShopOwner(shop.users);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              Éditer — {shop.name}
            </h1>
            {owner && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {owner.full_name ? `${owner.full_name} · ` : ""}{owner.email}
              </p>
            )}
          </div>
        </div>

        <form
          action={async (fd: FormData) => {
            "use server";
            await updateShopAdmin(id, {
              name: fd.get("name") as string,
              slug: fd.get("slug") as string,
              description: (fd.get("description") as string) || undefined,
              address: (fd.get("address") as string) || undefined,
              phone: (fd.get("phone") as string) || undefined,
              email_contact: (fd.get("email") as string) || undefined,
              is_active: fd.get("is_active") === "on",
            });
          }}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">Nom *</label>
            <input
              id="name"
              name="name"
              required
              defaultValue={shop.name}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="slug">Slug *</label>
            <input
              id="slug"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              defaultValue={shop.slug}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={shop.description ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">Téléphone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={shop.phone ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">Email contact</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={shop.email_contact ?? ""}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="address">Adresse</label>
            <input
              id="address"
              name="address"
              defaultValue={shop.address ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={shop.is_active}
              className="h-4 w-4 rounded border-input"
            />
            <label className="text-sm font-medium" htmlFor="is_active">Boutique active</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
              Annuler
            </Link>
            <button
              type="submit"
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-bento-accent)" }}
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
