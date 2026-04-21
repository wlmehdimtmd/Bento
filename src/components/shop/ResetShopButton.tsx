"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function ResetShopButton({ shopName }: { shopName: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t("dashboard.resetShop.toastUnexpectedError", "Unexpected error"));
        return;
      }
      toast.success(t("dashboard.resetShop.toastSuccess", "Shop reset"));
      setOpen(false);
      router.push(`/onboarding/shop?shopId=${data.shopId}`);
    } catch {
      toast.error(t("dashboard.resetShop.toastUnexpectedError", "Unexpected error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirm(""); }}>
      <DialogTrigger
        className="inline-flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        {t("dashboard.resetShop.trigger", "Reset shop")}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            {t("dashboard.resetShop.dialogTitle", "Reset shop")}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.resetShop.dialogDescription", "This action is irreversible.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-name">
            {t("dashboard.resetShop.confirmLabelPrefix", "Type")} <span className="font-semibold">{shopName}</span>{" "}
            {t("dashboard.resetShop.confirmLabelSuffix", "to confirm")}
          </Label>
          <Input
            id="confirm-name"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={shopName}
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            {t("dashboard.common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={confirm !== shopName || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("dashboard.resetShop.resetting", "Resetting...")}
              </>
            ) : (
              t("dashboard.resetShop.confirmAction", "Delete everything and start over")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
