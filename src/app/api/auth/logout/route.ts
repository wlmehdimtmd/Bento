import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import { getAuthRequestMeta } from "@/lib/auth/requestMeta";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.auth.signOut({ scope: "global" });

  await logAuthEvent("logout", user?.id ?? null, getAuthRequestMeta(request));

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", origin), { status: 302 });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
