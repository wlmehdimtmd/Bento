import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/auth-utils";

type Params = Promise<{ id: string }>;

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "En attente",  cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmée",   cls: "bg-blue-100 text-blue-700" },
  preparing: { label: "En prépa",    cls: "bg-violet-100 text-violet-700" },
  ready:     { label: "Prête",       cls: "bg-green-100 text-green-700" },
  delivered: { label: "Livrée",      cls: "bg-zinc-100 text-zinc-500" },
  cancelled: { label: "Annulée",     cls: "bg-red-100 text-red-600" },
};

export default async function AdminManageOrdersPage({ params }: { params: Params }) {
  const { id: shopId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await resolveIsAdmin(supabase, user))) redirect("/dashboard");

  const service = createServiceClient();

  const { data: orders } = await service
    .from("orders")
    .select("id, order_number, customer_name, total_amount, status, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{orders?.length ?? 0} commande{(orders?.length ?? 0) !== 1 ? "s" : ""}</p>

      <div className="rounded-lg border border-border overflow-hidden">
        {!orders?.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = STATUS_LABELS[o.status] ?? { label: o.status, cls: "bg-zinc-100 text-zinc-500" };
                return (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono font-medium">#{o.order_number}</td>
                    <td className="px-4 py-3">{o.customer_name}</td>
                    <td className="px-4 py-3 font-medium">{Number(o.total_amount).toFixed(2)} €</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
