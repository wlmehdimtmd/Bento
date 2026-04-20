import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { buttonVariants } from "@/components/ui/button";
import { createShopAdmin } from "@/app/admin/actions";

export const metadata = { title: "Admin — Nouvelle boutique" };

export default async function AdminNewShopPage() {
  await assertAdminOrRedirect();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
            Nouvelle boutique
          </h1>
        </div>

        <form
          action={async (fd: FormData) => {
            "use server";
            await createShopAdmin({
              owner_email: fd.get("owner_email") as string,
              name: fd.get("name") as string,
              slug: fd.get("slug") as string,
              description: (fd.get("description") as string) || undefined,
              address: (fd.get("address") as string) || undefined,
              phone: (fd.get("phone") as string) || undefined,
              email_contact: (fd.get("email") as string) || undefined,
            });
          }}
          className="space-y-4 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="owner_email">
              Email du propriétaire *
            </label>
            <input
              id="owner_email"
              name="owner_email"
              type="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">Nom *</label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="Ma boutique"
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
              placeholder="ma-boutique"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Lettres minuscules, chiffres et tirets uniquement.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">Email contact</label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="address">Adresse</label>
            <input
              id="address"
              name="address"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
              Annuler
            </Link>
            <button
              type="submit"
              className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Créer la boutique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
