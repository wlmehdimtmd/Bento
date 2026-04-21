"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/LocaleProvider";

export const ORDER_SUCCESS_PENDING_REFRESH_MS = 5000;

/** Rafraîchissement périodique + action manuelle pendant l’attente du webhook Stripe. */
export function OrderSuccessPendingRefresh() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, ORDER_SUCCESS_PENDING_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <Button type="button" variant="secondary" className="w-full" onClick={() => router.refresh()}>
      {t("order.refreshNow")}
    </Button>
  );
}

