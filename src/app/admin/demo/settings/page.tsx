import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { assertAdminOrRedirect } from "@/lib/admin/requireAdmin";
import { setDemoShopId } from "@/app/admin/actions";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin — Paramètres démo" };

export default async function AdminDemoSettingsPage() {
  const service = await assertAdminOrRedirect();

  const [{ data: settings, error: settingsErr }, { data: shops }] = await Promise.all([
    service.from("platform_settings").select("demo_shop_id").eq("id", "default").maybeSingle(),
    service.from("shops").select("id, name, slug, is_active").order("name"),
  ]);

  if (settingsErr && /relation|does not exist|schema cache/i.test(settingsErr.message)) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-xl space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6">
          <p className="font-semibold">Table « platform_settings » introuvable</p>
          <p className="text-sm text-muted-foreground">
            Exécutez le script SQL{" "}
            <code className="rounded bg-muted px-1">scripts/apply-platform-settings.sql</code> dans
            Supabase, puis rechargez cette page.
          </p>
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}>
            Retour admin
          </Link>
        </div>
      </div>
    );
  }

  const currentId = (settings as { demo_shop_id: string | null } | null)?.demo_shop_id ?? null;
  const shopList = (shops ?? []) as {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  }[];

  const mirrorOptions = shopList.filter((s) => s.is_active);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-onest)" }}>
              Paramètres démo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez la vitrine affichée sur <code className="text-xs">/demo</code> et dans le bloc
              démo de la page d&apos;accueil. Sans miroir, la démo intégrée (données React) est utilisée.
              Avec un miroir, le contenu provient d&apos;une boutique réelle (active) en base.
            </p>
          </div>
        </div>

        <form
          action={async (fd: FormData) => {
            "use server";
            const raw = (fd.get("demo_shop_id") as string) ?? "__static__";
            await setDemoShopId(raw === "__static__" ? null : raw);
          }}
          className="space-y-6 rounded-lg border border-border bg-card p-6"
        >
          <div className="space-y-2">
            <label htmlFor="demo_shop_id" className="text-sm font-medium">
              Miroir sur <code className="text-xs">/demo</code>{" "}
              <span className="text-destructive">*</span>
            </label>
            <select
              id="demo_shop_id"
              name="demo_shop_id"
              defaultValue={currentId ?? "__static__"}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="__static__">Par défaut — démo intégrée (sans boutique miroir)</option>
              {mirrorOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  Miroir : {s.name} (/{s.slug})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              « Par défaut » laisse <code className="text-xs">demo_shop_id</code> vide :{" "}
              <code className="text-xs">/demo</code> et le hero landing utilisent la vitrine statique.
              Seules les boutiques <strong>actives</strong> peuvent servir de miroir.
            </p>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={cn(buttonVariants(), "text-primary-foreground hover:opacity-90")}
              style={{ backgroundColor: "var(--primary)" }}
            >
              Enregistrer
            </button>
            <Link
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Ouvrir /demo
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
