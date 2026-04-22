import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import { buildAuthEmailConfirmationRedirectUrl } from "@/lib/merchant-bootstrap";
import { registerBodySchema } from "@/lib/auth/registerBodySchema";
import { getAuthRequestMeta } from "@/lib/auth/requestMeta";

export async function POST(request: Request) {
  let body: { email: string; password: string; full_name: string };
  try {
    const raw: unknown = await request.json();
    body = registerBodySchema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.issues[0]?.message ?? "Invalid payload";
      return NextResponse.json({ error: first, code: "validation_error" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, full_name } = body;
  const meta = getAuthRequestMeta(request);

  const emailRedirectTo = buildAuthEmailConfirmationRedirectUrl(request);
  if (
    process.env.NODE_ENV === "production" &&
    (() => {
      try {
        const host = new URL(emailRedirectTo).hostname.toLowerCase();
        return host === "localhost" || host === "127.0.0.1" || host === "::1";
      } catch {
        return true;
      }
    })()
  ) {
    console.error("[register] Refusing signup email redirect URL in production", {
      emailRedirectTo,
    });
    return NextResponse.json(
      { error: "Auth redirect misconfiguration. Please contact support." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuthEvent("register", data.user?.id ?? null, meta);
  return NextResponse.json({
    userId: data.user?.id ?? null,
    hasSession: !!data.session,
  });
}
