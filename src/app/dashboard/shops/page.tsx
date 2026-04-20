import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Une seule boutique par compte : plus de liste marchand, on renvoie vers la boutique ou le tableau de bord. */
export default async function ShopsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shop) redirect(`/dashboard/shops/${shop.id}`);
  redirect("/dashboard");
}
