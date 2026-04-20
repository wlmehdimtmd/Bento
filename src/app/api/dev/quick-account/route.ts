import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

// Dev-only : jamais en prod ; en dev (next dev) autorisé ; sinon flag explicite (ex. preview)
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ENABLE_DEV_ROUTES !== "true"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = Math.random().toString(36).slice(2, 8);
  const email = `test-${id}@bento.local`;
  const password = `Test-${id}-pwd!`;
  const full_name = `Test ${id}`;

  // Crée l'utilisateur déjà confirmé — aucun email envoyé
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (userError || !userData.user) {
    return NextResponse.json({ error: userError?.message ?? "Erreur création user" }, { status: 500 });
  }

  const userId = userData.user.id;
  const slug = `${slugify(full_name)}-${userId.slice(0, 6)}`;

  const { data: shopData, error: shopError } = await admin
    .from("shops")
    .insert({ owner_id: userId, name: `Shop ${id}`, slug, type: "other" })
    .select("id")
    .single();

  if (shopError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: shopError.message }, { status: 500 });
  }

  // Connecte l'utilisateur via le client serveur normal (crée la session cookie)
  const supabase = await createServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 500 });
  }

  return NextResponse.json({ shopId: shopData.id });
}
