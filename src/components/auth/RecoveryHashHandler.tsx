"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/**
 * Flux « mot de passe oublié » Supabase :
 * - PKCE (défaut @supabase/ssr) : `?code=…` sur `/` (Site URL) ou `/reset-password`.
 * - Ancien flux : `#access_token=…&type=recovery` sur le Site URL.
 */
export function RecoveryHashHandler() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const pathname = url.pathname === "" ? "/" : url.pathname;
    const code = url.searchParams.get("code");

    // PKCE : échange client si le lien pointe encore vers la page (sans passer par /api/auth/callback).
    if (code && (pathname === "/" || pathname === "/reset-password")) {
      started.current = true;
      void (async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", pathname);
        if (error) {
          console.error("[recovery] exchangeCodeForSession:", error.message);
          toast.error("Lien invalide ou expiré. Demandez un nouveau lien depuis la connexion.");
          started.current = false;
          return;
        }
        if (pathname === "/") {
          router.replace("/reset-password");
        }
        router.refresh();
      })();
      return;
    }

    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (type !== "recovery" || !accessToken || !refreshToken) return;

    started.current = true;

    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );

      if (error) {
        console.error("[recovery] setSession:", error.message);
        toast.error("Lien invalide ou expiré. Demandez un nouveau lien depuis la connexion.");
        started.current = false;
        return;
      }

      router.replace("/reset-password");
      router.refresh();
    })();
  }, [router]);

  return null;
}
