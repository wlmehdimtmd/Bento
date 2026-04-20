"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/**
 * Les emails Supabase « recovery » redirigent souvent vers le Site URL avec
 * `#access_token=…&type=recovery`. Le serveur ne voit jamais ce hash : il faut
 * un client qui appelle `setSession` puis redirige vers `/reset-password`.
 */
export function RecoveryHashHandler() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
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
