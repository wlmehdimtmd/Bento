"use client";

import { useState, useTransition } from "react";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { deleteShop, toggleShopActive } from "./actions";

interface Props {
  shopId: string;
  isActive: boolean;
}

export function AdminShopActions({ shopId, isActive }: Props) {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleShopActive(shopId, active);
        setActive((v) => !v);
        toast.success(active ? "Boutique désactivée" : "Boutique activée", { position: "top-center" });
      } catch {
        toast.error("Erreur lors du changement de statut", { position: "top-center" });
      }
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer cette boutique ? Cette action est irréversible.")) return;
    startTransition(async () => {
      try {
        await deleteShop(shopId);
        toast.success("Boutique supprimée", { position: "top-center" });
      } catch {
        toast.error("Erreur lors de la suppression", { position: "top-center" });
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={pending}
        title={active ? "Désactiver" : "Activer"}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        {active ? (
          <ToggleRight className="h-4 w-4 text-green-600" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={pending}
        title="Supprimer"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
