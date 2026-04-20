import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";

function getClientMeta(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const meta = getClientMeta(request);

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("[api/auth/login] signInWithPassword failed:", error.message, error.code);

      const isAuthError = error.code === "invalid_credentials" || error.code === "email_not_confirmed";
      if (isAuthError) {
        await logAuthEvent("login_failed", null, meta);
        return NextResponse.json({ error: error.message, code: error.code }, { status: 401 });
      }

      // Erreur serveur (hook failure, réseau, etc.) — ne pas logger comme login_failed
      console.error("[api/auth/login] Server-side error during sign-in:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    await logAuthEvent("login", data.user.id, meta);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/auth/login] Unhandled error:", err);
    return NextResponse.json(
      {
        error: "Erreur serveur de configuration/authentification.",
        code: "auth_server_misconfigured",
      },
      { status: 503 }
    );
  }
}
