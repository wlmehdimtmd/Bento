import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import { buildAuthEmailConfirmationRedirectUrl } from "@/lib/merchant-bootstrap";

function getClientMeta(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function POST(request: Request) {
  const { email, password, full_name } = await request.json();
  const meta = getClientMeta(request);

  const emailRedirectTo = buildAuthEmailConfirmationRedirectUrl(request);

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
