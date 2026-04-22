import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import { resolveIsAdmin } from "@/lib/auth-utils";
import { getAuthRequestMeta } from "@/lib/auth/requestMeta";
import { normalizeUsername } from "@/lib/auth/usernameSchema";

function looksLikeEmail(raw: string): boolean {
  return raw.includes("@");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      identifier?: unknown;
      password?: unknown;
    };
    const meta = getAuthRequestMeta(request);

    const rawIdentifier =
      typeof body.identifier === "string" && body.identifier.trim().length > 0
        ? body.identifier
        : typeof body.email === "string"
          ? body.email
          : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!rawIdentifier.trim() || !password) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis.", code: "validation_error" },
        { status: 400 }
      );
    }

    let emailForSignIn = rawIdentifier.trim();
    if (!looksLikeEmail(emailForSignIn)) {
      const username = normalizeUsername(emailForSignIn);
      try {
        const service = createServiceClient();
        const { data: row, error: lookupError } = await service
          .from("users")
          .select("email")
          .eq("username", username)
          .maybeSingle();

        if (lookupError) {
          console.error("[api/auth/login] username lookup failed:", lookupError.message);
          return NextResponse.json(
            { error: "Erreur serveur de configuration/authentification.", code: "auth_server_misconfigured" },
            { status: 503 }
          );
        }

        if (!row?.email) {
          await logAuthEvent("login_failed", null, meta);
          return NextResponse.json(
            { error: "Invalid login credentials", code: "invalid_credentials" },
            { status: 401 }
          );
        }

        emailForSignIn = row.email as string;
      } catch (e) {
        console.error("[api/auth/login] service client unavailable:", e);
        return NextResponse.json(
          { error: "Erreur serveur de configuration/authentification.", code: "auth_server_misconfigured" },
          { status: 503 }
        );
      }
    } else {
      emailForSignIn = emailForSignIn.trim().toLowerCase();
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailForSignIn,
      password,
    });

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
    const admin = await resolveIsAdmin(supabase, data.user);
    return NextResponse.json({
      success: true,
      redirectTo: admin ? "/admin" : "/dashboard",
    });
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
