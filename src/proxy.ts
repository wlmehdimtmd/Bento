import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { authRatelimit } from "@/lib/ratelimit";
import { resolveIsAdmin } from "@/lib/auth-utils";

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

function createSupabaseFromRequest(request: NextRequest): {
  response: NextResponse;
  supabase: ReturnType<typeof createServerClient>;
} {
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

  return { response, supabase };
}

async function getSupabaseUserAndResponse(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null; supabase: ReturnType<typeof createServerClient> }> {
  const { response, supabase } = createSupabaseFromRequest(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { response, user, supabase };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting sur les routes auth.
  // Si Upstash est mal configuré/indisponible, on n'empêche pas l'auth (fail-open).
  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    if (authRatelimit) {
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
        console.error("[proxy] Rate limiter error (fail-open):", err);
      }
    } else {
      console.warn("[proxy] Rate limiter disabled: invalid or missing Upstash env vars.");
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
    const { response } = await getSupabaseUserAndResponse(request);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  // Auth routes — redirect already-authenticated users to /dashboard
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (hasSupabaseSession(request)) {
      const { response, user, supabase } = await getSupabaseUserAndResponse(request);
      // Important: do not redirect if session cookies exist but resolve to no user.
      // This situation can happen with stale/expired cookies and would cause
      // a login <-> dashboard redirect loop.
      if (!user) {
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
        return response;
      }
      const url = request.nextUrl.clone();
      url.pathname = (await resolveIsAdmin(supabase, user)) ? "/admin" : "/dashboard";
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
