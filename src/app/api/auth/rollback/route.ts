import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Supprime le compte auth de l'utilisateur courant.
 * Appelé lors d'une inscription partielle (compte créé mais étape suivante échouée)
 * pour éviter les comptes orphelins sans boutique associée.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const service = createServiceClient();
    const { error } = await service.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[rollback] Échec suppression utilisateur", {
        userId: user.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: "Rollback échoué" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[rollback] Erreur inattendue", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
