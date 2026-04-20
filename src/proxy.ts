import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRatelimit } from "@/lib/ratelimit";

const RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/callback",
];

// Cookie presence check — fast path at edge.
// Full token validation happens in Server Component layouts via getUser().
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.endsWith("-auth-token"));
}

async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting sur les routes auth — fail-closed si Redis indisponible
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "anonymous";

      const { success } = await authRatelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          { error: "Trop de tentatives, réessayez plus tard." },
          { status: 429 }
        );
      }
    } catch (err) {
      console.error("[proxy] Rate limiter error (fail-closed):", err);
      return NextResponse.json(
        { error: "Service temporairement indisponible. Réessayez plus tard." },
        { status: 503 }
      );
    }
  }

  // Protected routes — redirect unauthenticated visitors to /login
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!hasSupabaseSession(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("Cache-Control", "no-store");
      return redirect;
    }
    const response = await refreshSupabaseSession(request);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  // Auth routes — redirect already-authenticated users to /dashboard
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (hasSupabaseSession(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirect = NextResponse.redirect(url);
      redirect.headers.set("Cache-Control", "no-store");
      return redirect;
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
