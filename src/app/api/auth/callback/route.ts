import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuthEvent } from "@/lib/auth-logger";
import {
  ensureDefaultShopForOwner,
  sanitizeAuthNextPath,
} from "@/lib/merchant-bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const safeNext = sanitizeAuthNextPath(searchParams.get("next"));
  const meta = {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await logAuthEvent("login", data.user.id, meta);

      const fullName =
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : undefined;

      const shopResult = await ensureDefaultShopForOwner(
        supabase,
        data.user.id,
        fullName
      );

      if (!shopResult.ok) {
        return NextResponse.redirect(new URL("/login?error=shop_bootstrap_failed", origin).toString());
      }

      const path = shopResult.created
        ? `/onboarding/shop?shopId=${encodeURIComponent(shopResult.shopId)}`
        : safeNext;

      return NextResponse.redirect(new URL(path, origin).toString());
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin).toString());
}
