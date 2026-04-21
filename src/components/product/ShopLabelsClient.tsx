"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_SHOP_LABELS,
  normalizeLabelValue,
  type ShopLabelOption,
} from "@/lib/shop-labels";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface ShopLabelsClientProps {
  shopId: string;
  initialLabels: ShopLabelOption[];
  existingProductTags: string[];
}

interface LabelDraft {
  id?: string;
  label: string;
}

const DEFAULT_COLOR = "#1d4ed8";

export function ShopLabelsClient({
  shopId,
  initialLabels,
  existingProductTags,
}: ShopLabelsClientProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const supabase = createClient();

  const [labels, setLabels] = useState<ShopLabelOption[]>(initialLabels);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<LabelDraft>({
    label: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<ShopLabelOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const count = labels.length;
  const isAtLimit = count >= MAX_SHOP_LABELS;
  const sorted = useMemo(
    () => [...labels].sort((a, b) => a.display_order - b.display_order),
    [labels]
  );

  const mappedValues = useMemo(() => new Set(sorted.map((item) => item.value)), [sorted]);
  const mappedProductTags = useMemo(
    () => existingProductTags.filter((tag) => mappedValues.has(tag)),
    [existingProductTags, mappedValues]
  );
  const unmappedProductTags = useMemo(
    () => existingProductTags.filter((tag) => !mappedValues.has(tag)),
    [existingProductTags, mappedValues]
  );

  function openCreate() {
    if (isAtLimit) {
      toast.error(tr("Limite atteinte: 50 labels maximum.", "Limit reached: 50 labels maximum."));
      return;
    }
    setDraft({ label: "" });
    setDialogOpen(true);
  }

  function openEdit(item: ShopLabelOption) {
    setDraft({
      id: item.id,
      label: item.label,
    });
    setDialogOpen(true);
  }

  function openDelete(item: ShopLabelOption) {
    setDeleting(item);
    setDeleteOpen(true);
  }

  async function saveLabel() {
    const labelText = draft.label.trim();
    if (!labelText) {
      toast.error(tr("Le nom du label est requis.", "Label name is required."));
      return;
    }
    const value = normalizeLabelValue(labelText);
    if (!value) {
      toast.error(tr("Nom invalide pour générer une clé de label.", "Invalid name to generate label key."));
      return;
    }

    const duplicate = sorted.find(
      (item) => item.value === value && item.id !== draft.id
    );
    if (duplicate) {
      toast.error(tr("Un label avec ce nom existe déjà.", "A label with this name already exists."));
      return;
    }

    setIsSaving(true);

    if (draft.id) {
      const { data, error } = await supabase
        .from("shop_labels")
        .update({
          label: labelText,
          value,
          color: DEFAULT_COLOR,
        })
        .eq("id", draft.id)
        .select("id, shop_id, value, label, color, display_order, created_at, updated_at")
        .single();

      setIsSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLabels((prev) =>
        prev.map((item) => (item.id === draft.id ? (data as ShopLabelOption) : item))
      );
      setDialogOpen(false);
      toast.success(tr("Label mis a jour.", "Label updated."));
      router.refresh();
      return;
    }

    const { data, error } = await supabase
      .from("shop_labels")
      .insert({
        shop_id: shopId,
        label: labelText,
        value,
        color: DEFAULT_COLOR,
        display_order: sorted.length,
      })
      .select("id, shop_id, value, label, color, display_order, created_at, updated_at")
      .single();

    setIsSaving(false);

    if (error) {
      if (error.message.includes("SHOP_LABEL_LIMIT_REACHED")) {
        toast.error(tr("Maximum 50 labels par boutique.", "Maximum 50 labels per shop."));
      } else {
        toast.error(error.message);
      }
      return;
    }

    setLabels((prev) => [...prev, data as ShopLabelOption]);
    setDialogOpen(false);
    toast.success(tr("Label ajoute.", "Label added."));
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const { error } = await supabase.from("shop_labels").delete().eq("id", deleting.id);
    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setLabels((prev) => prev.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    toast.success(tr("Label supprime.", "Label deleted."));
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {count} / {MAX_SHOP_LABELS} {tr("labels", "labels")}
          </p>
          <Button
            onClick={openCreate}
            disabled={isAtLimit}
            style={{ backgroundColor: "var(--primary)" }}
            className="text-primary-foreground hover:opacity-90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {tr("Nouveau label", "New label")}
          </Button>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {tr("Aucun label personnalise pour le moment.", "No custom labels yet.")}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr("Label", "Label")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{tr("Cle", "Key")}</TableHead>
                  <TableHead className="w-24 text-right">{tr("Actions", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="secondary">{item.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <code className="text-xs text-muted-foreground">{item.value}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          aria-label={tr("Modifier", "Edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(item)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label={tr("Supprimer", "Delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{tr("Tags detectes dans les produits", "Detected tags in products")}</p>
            <p className="text-xs text-muted-foreground">
              {existingProductTags.length} {tr("tag(s) trouve(s) dans la base pour cette boutique.", "tag(s) found in this shop database.")}
            </p>
          </div>

          {existingProductTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tr("Aucun tag present dans les produits.", "No tags found in products.")}
            </p>
          ) : (
            <div className="space-y-2">
              {unmappedProductTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {tr("Non mappes", "Unmapped")} ({unmappedProductTags.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {unmappedProductTags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {mappedProductTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {tr("Mappes", "Mapped")} ({mappedProductTags.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {mappedProductTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{draft.id ? tr("Modifier le label", "Edit label") : tr("Nouveau label", "New label")}</DialogTitle>
          <DialogDescription>
            {tr("Ce label pourra etre applique sur vos produits.", "This label can be applied to your products.")}
          </DialogDescription>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="label-name" className="text-sm font-medium">
                {tr("Nom", "Name")}
              </label>
              <Input
                id="label-name"
                value={draft.label}
                onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                placeholder={tr("Ex: Nouveaute", "Ex: New")}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {tr("Annuler", "Cancel")}
            </Button>
            <Button
              onClick={saveLabel}
              disabled={isSaving}
              style={{ backgroundColor: "var(--primary)" }}
              className="text-primary-foreground hover:opacity-90"
            >
              {isSaving ? tr("Enregistrement...", "Saving...") : tr("Enregistrer", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Supprimer le label", "Delete label")}</DialogTitle>
          <DialogDescription>
            {tr("Confirmer la suppression de", "Confirm deletion of")} <strong>{deleting?.label}</strong> ?
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              {tr("Annuler", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? tr("Suppression...", "Deleting...") : tr("Supprimer", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
