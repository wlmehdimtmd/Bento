"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function DeleteAccountButton({ authEmail }: { authEmail: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const emailLower = authEmail.trim().toLowerCase();
  const canSubmit = emailLower.length > 0 && confirm.trim().toLowerCase() === emailLower;

  async function handleDelete() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirm.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        console.error("[delete-account]", res.status, data);
        if (data.code === "confirm_mismatch") {
          toast.error(t("dashboard.settings.deleteAccount.confirmMismatch"));
        } else if (res.status === 503) {
          toast.error(t("dashboard.settings.deleteAccount.serverMisconfigured"));
        } else {
          toast.error(data.error ?? t("dashboard.settings.deleteAccount.toastError"));
        }
        return;
      }

      toast.success(t("dashboard.settings.deleteAccount.toastSuccess"));
      setOpen(false);
      setConfirm("");
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("[delete-account] unexpected:", e);
      toast.error(t("dashboard.settings.deleteAccount.toastError"));
    } finally {
      setLoading(false);
    }
  }

  if (!authEmail.trim()) {
    return null;
  }

  return (
    <>
      <Button type="button" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>
        {t("dashboard.settings.deleteAccount.trigger")}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setConfirm("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5 shrink-0" />
              {t("dashboard.settings.deleteAccount.dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("dashboard.settings.deleteAccount.dialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-account-confirm-email">
              {t("dashboard.settings.deleteAccount.confirmLabelPrefix")}{" "}
              <span className="font-semibold text-foreground">{authEmail}</span>{" "}
              {t("dashboard.settings.deleteAccount.confirmLabelSuffix")}
            </Label>
            <Input
              id="delete-account-confirm-email"
              type="email"
              autoComplete="off"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={authEmail}
              disabled={loading}
              aria-invalid={confirm.length > 0 && !canSubmit}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t("dashboard.account.dialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={!canSubmit || loading} onClick={() => void handleDelete()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.settings.deleteAccount.deleting")}
                </>
              ) : (
                t("dashboard.settings.deleteAccount.confirmAction")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
