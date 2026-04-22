import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import { getAuthRequestMeta } from "@/lib/auth/requestMeta";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié.", code: "unauthorized" }, { status: 401 });
  }

  let body: { confirmation?: unknown };
  try {
    body = (await request.json()) as { confirmation?: unknown };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide.", code: "invalid_json" }, { status: 400 });
  }

  const expected = (user.email ?? "").trim().toLowerCase();
  const typed =
    typeof body.confirmation === "string" ? body.confirmation.trim().toLowerCase() : "";

  if (!expected || typed !== expected) {
    return NextResponse.json(
      { error: "La confirmation ne correspond pas à votre e-mail.", code: "confirm_mismatch" },
      { status: 400 }
    );
  }

  const meta = getAuthRequestMeta(request);

  try {
    await logAuthEvent("account_deleted", user.id, meta);

    const admin = createServiceClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[api/auth/delete-account] admin.deleteUser:", error.message);
      return NextResponse.json(
        { error: "Impossible de supprimer le compte. Réessayez ou contactez le support.", code: "delete_failed" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("[api/auth/delete-account] service client or delete:", e);
    return NextResponse.json(
      { error: "Configuration serveur incomplète (clé service).", code: "auth_server_misconfigured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true });
}
