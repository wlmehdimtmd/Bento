"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Gift, Search, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BundleForm, type BundleRow, type BundleSavePayload } from "./BundleForm";
import { ImportMenuDropdown } from "./ImportMenuDropdown";
import { TemplatePickerDialog, importTemplatesIntoShop, type ImportData } from "@/components/templates/TemplatePickerDialog";
import { PasteJsonImportDialog } from "@/components/import/PasteJsonImportDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CategoryOption {
  id: string;
  name: string;
  icon_emoji: string;
}

interface AdminBundleActions {
  onSave: (payload: BundleSavePayload, isEdit: boolean, existingId?: string) => Promise<BundleRow>;
  onDelete: (id: string) => Promise<void>;
}

interface BundlesClientProps {
  shopId: string;
  categories: CategoryOption[];
  initialBundles: BundleRow[];
  /** Regroupe les formules actives sous une carte « Menu » sur la vitrine. */
  initialBundlesMenuGrouped?: boolean;
  /** Admin ou action serveur : mise à jour du flag boutique (contourne RLS). */
  onBundlesMenuGroupedChange?: (value: boolean) => Promise<void>;
  adminActions?: AdminBundleActions;
}

export function BundlesClient({
  shopId,
  categories,
  initialBundles,
  initialBundlesMenuGrouped = false,
  onBundlesMenuGroupedChange,
  adminActions,
}: BundlesClientProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const [bundles, setBundles] = useState<BundleRow[]>(initialBundles);
  const [bundlesMenuGrouped, setBundlesMenuGrouped] = useState(initialBundlesMenuGrouped);

  useEffect(() => {
    setBundlesMenuGrouped(initialBundlesMenuGrouped);
  }, [initialBundlesMenuGrouped]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleRow | null>(null);
  const [formSubView, setFormSubView] = useState<"main" | "photo" | "composition">("main");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile(768);

  const displayedBundles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bundles;
    return bundles.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (b.name_en ?? "").toLowerCase().includes(q) ||
        (b.description_en ?? "").toLowerCase().includes(q)
    );
  }, [bundles, search]);

  const listSummaryText = useMemo(() => {
    const q = search.trim();
    const n = displayedBundles.length;
    const total = bundles.length;
    if (q) {
      return (
        <>
          {locale === "en"
            ? `${n} result${n !== 1 ? "s" : ""} for`
            : `${n} résultat${n !== 1 ? "s" : ""} pour`}{" "}
          &laquo;{q}&raquo;
          {total !== n && (
            <span className="text-muted-foreground/80"> ({total} {tr("au total", "total")})</span>
          )}
        </>
      );
    }
    return (
      <>
        {total} formule{total !== 1 ? "s" : ""}
      </>
    );
  }, [displayedBundles.length, locale, search, bundles.length, tr]);

  async function handleTemplateImport(data: ImportData) {
    const supabase = createClient();
    const existing = categories.map((c) => ({ id: c.id, name: c.name }));
    const { bundleCount } = await importTemplatesIntoShop(supabase, shopId, data, existing);
    toast.success(
      locale === "en"
        ? `${bundleCount} bundle${bundleCount !== 1 ? "s" : ""} imported!`
        : `${bundleCount} formule${bundleCount !== 1 ? "s" : ""} importée${bundleCount !== 1 ? "s" : ""} !`
    );
    router.refresh();
  }

  // ── Handlers ────────────────────────────────────────────────

  function openCreate() {
    setEditingBundle(null);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openEdit(b: BundleRow) {
    setEditingBundle(b);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  function handleFormSuccess(updated: BundleRow) {
    setFormOpen(false);
    setFormSubView("main");
    setBundles((prev) => {
      const exists = prev.find((b) => b.id === updated.id);
      if (exists) return prev.map((b) => (b.id === updated.id ? updated : b));
      return [...prev, updated];
    });
    router.refresh();
  }

  async function handleBundlesMenuGroupedChange(checked: boolean) {
    const prev = bundlesMenuGrouped;
    setBundlesMenuGrouped(checked);

    try {
      if (onBundlesMenuGroupedChange) {
        await onBundlesMenuGroupedChange(checked);
      } else {
        const supabase = createClient();
        const { error } = await supabase
          .from("shops")
          .update({ bundles_menu_grouped: checked })
          .eq("id", shopId);
        if (error) throw new Error(error.message);
      }
      toast.success(
        checked
          ? tr("Les formules sont regroupées sous « Menu » sur la vitrine.", "Bundles are grouped under Menu on the storefront.")
          : tr("Les formules s’affichent à nouveau en tuiles séparées sur la vitrine.", "Bundles are displayed again as separate tiles on the storefront.")
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("Impossible d’enregistrer l’option.", "Unable to save option."));
      setBundlesMenuGrouped(prev);
    }
  }

  async function handleToggleActive(bundle: BundleRow) {
    const newValue = !bundle.is_active;
    setBundles((prev) =>
      prev.map((b) => (b.id === bundle.id ? { ...b, is_active: newValue } : b))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("bundles")
      .update({ is_active: newValue })
      .eq("id", bundle.id);

    if (error) {
      toast.error(error.message);
      setBundles((prev) =>
        prev.map((b) =>
          b.id === bundle.id ? { ...b, is_active: bundle.is_active } : b
        )
      );
    } else {
      toast.success(newValue ? tr("Formule activée", "Bundle enabled") : tr("Formule désactivée", "Bundle disabled"));
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    if (adminActions) {
      try {
        await adminActions.onDelete(deletingId);
        setBundles((prev) => prev.filter((b) => b.id !== deletingId));
        toast.success(tr("Formule supprimée.", "Bundle deleted."));
      } catch {
        toast.error(tr("Erreur lors de la suppression.", "Error while deleting."));
      } finally {
        setIsDeleting(false);
        setDeleteOpen(false);
        setDeletingId(null);
      }
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("bundles")
      .delete()
      .eq("id", deletingId);

    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      toast.error(error.message);
    } else {
      setBundles((prev) => prev.filter((b) => b.id !== deletingId));
      toast.success(tr("Formule supprimée.", "Bundle deleted."));
      router.refresh();
    }
    setDeletingId(null);
  }

  const deletingBundle = bundles.find((b) => b.id === deletingId);
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5 min-w-0">
            <Label htmlFor="bundles-menu-grouped" className="text-sm font-medium">
              {tr("Carte « Menu » sur la vitrine", "Menu card on storefront")}
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {tr(
                "Une seule tuile type catégorie regroupe vos formules actives ; vos clients ouvrent la liste au clic. Sinon, chaque formule reste une tuile dédiée sur la grille bento.",
                "A single category-like tile groups your active bundles; customers open the list on click. Otherwise, each bundle remains a dedicated tile in the bento grid."
              )}
            </p>
          </div>
          <Switch
            id="bundles-menu-grouped"
            checked={bundlesMenuGrouped}
            onCheckedChange={handleBundlesMenuGroupedChange}
            className="shrink-0"
            aria-label={tr(
              "Regrouper les formules sous la carte Menu sur la vitrine",
              "Group bundles under the Menu card on storefront"
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={tr("Rechercher une formule…", "Search a bundle...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground min-w-0 flex-1">
            {listSummaryText}
          </p>
          <div className="flex gap-2 shrink-0">
            {!adminActions && (
              <ImportMenuDropdown
                onImportTemplate={() => setTemplateOpen(true)}
                onImportJson={() => setJsonImportOpen(true)}
              />
            )}
            <Button
              onClick={openCreate}
              style={{ backgroundColor: "var(--primary)" }}
              className="text-primary-foreground hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {tr("Nouvelle formule", "New bundle")}
            </Button>
          </div>
        </div>

      {/* Empty state */}
      {bundles.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Gift className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {tr(
              "Aucune formule. Créez-en une pour proposer des menus composés.",
              "No bundles. Create one to offer set menus."
            )}
          </p>
        </div>
      )}

      {bundles.length > 0 && displayedBundles.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Gift className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {tr("Aucune formule ne correspond à votre recherche.", "No bundles match your search.")}
          </p>
        </div>
      )}

      {displayedBundles.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{tr("Formule", "Bundle")}</TableHead>
                <TableHead className="hidden lg:table-cell max-w-[280px]">
                  {tr("Composition", "Composition")}
                </TableHead>
                <TableHead className="text-right w-28">{tr("Prix", "Price")}</TableHead>
                {!adminActions && (
                  <TableHead className="text-center w-24">{tr("Actif", "Active")}</TableHead>
                )}
                <TableHead className="text-right w-24">{tr("Actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedBundles.map((bundle) => (
                <TableRow
                  key={bundle.id}
                  className={!bundle.is_active ? "opacity-50" : undefined}
                >
                  <TableCell className="py-2">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                      {bundle.image_url ? (
                        <Image
                          src={bundle.image_url}
                          alt={bundle.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm">
                          🎁
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <p
                      className="font-medium truncate max-w-[200px]"
                      style={{ fontFamily: "var(--font-onest)" }}
                    >
                      {bundle.name}
                    </p>
                    {bundle.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] lg:hidden">
                        {bundle.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="py-2 hidden lg:table-cell">
                    <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {bundleSlotsSummary(bundle, catMap)}
                    </p>
                  </TableCell>
                  <TableCell className="text-right py-2 font-medium tabular-nums text-[var(--primary)]">
                    {formatPrice(bundle.price)}
                  </TableCell>
                  {!adminActions && (
                    <TableCell className="text-center py-2">
                      <Switch
                        checked={bundle.is_active}
                        onCheckedChange={() => handleToggleActive(bundle)}
                        size="sm"
                        aria-label={bundle.is_active ? tr("Désactiver", "Disable") : tr("Activer", "Enable")}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(bundle)}
                        aria-label={tr("Modifier", "Edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDelete(bundle.id)}
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

      </div>

      <TemplatePickerDialog
        mode="bundles"
        shopCategories={categories}
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        onImport={handleTemplateImport}
      />
      <PasteJsonImportDialog
        open={jsonImportOpen}
        onOpenChange={setJsonImportOpen}
        shopId={shopId}
        onImported={() => {
          router.refresh();
        }}
      />

      {/* Create / Edit panel */}
      {isMobile ? (
        <Drawer
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setFormSubView("main");
          }}
        >
          <DrawerContent className="flex h-auto max-h-[92vh] min-h-0 flex-col overflow-hidden p-0">
            <DrawerHeader
              className={
                formSubView !== "main"
                  ? "shrink-0 flex-row items-center gap-2 border-b border-border px-4 pb-3 pt-2 text-left"
                  : "shrink-0 border-b border-border px-4 pb-3 pt-2"
              }
            >
              {formSubView !== "main" ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setFormSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>
                {formSubView === "photo"
                  ? tr("Photo de la formule", "Bundle photo")
                  : formSubView === "composition"
                    ? tr("Composition du menu", "Menu composition")
                    : editingBundle
                      ? tr("Modifier la formule", "Edit bundle")
                      : tr("Nouvelle formule", "New bundle")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <BundleForm
                shopId={shopId}
                categories={categories}
                initialData={editingBundle ?? undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => setFormOpen(false)}
                onSave={adminActions?.onSave}
                subViewOverride={formSubView}
                onSubViewChange={setFormSubView}
                stickyMobileActions
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setFormSubView("main");
          }}
        >
          <SheetContent
            side="right"
            className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          >
            <SheetHeader
              className={
                formSubView !== "main"
                  ? "shrink-0 flex-row items-center gap-2 border-b border-border"
                  : "shrink-0 border-b border-border"
              }
            >
              {formSubView !== "main" ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setFormSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>
                {formSubView === "photo"
                  ? tr("Photo de la formule", "Bundle photo")
                  : formSubView === "composition"
                    ? tr("Composition du menu", "Menu composition")
                    : editingBundle
                      ? tr("Modifier la formule", "Edit bundle")
                      : tr("Nouvelle formule", "New bundle")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <BundleForm
                shopId={shopId}
                categories={categories}
                initialData={editingBundle ?? undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => setFormOpen(false)}
                onSave={adminActions?.onSave}
                subViewOverride={formSubView}
                onSubViewChange={setFormSubView}
                stickySheetActions
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Supprimer la formule", "Delete bundle")}</DialogTitle>
          <DialogDescription>
            {tr("Êtes-vous sûr de vouloir supprimer", "Are you sure you want to delete")}{" "}
            <strong>&laquo;{deletingBundle?.name}&raquo;</strong> ?
            {" "}{tr("Cette action est irréversible.", "This action is irreversible.")}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              {tr("Annuler", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? tr("Suppression…", "Deleting...") : tr("Supprimer", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function bundleSlotsSummary(
  bundle: BundleRow,
  catMap: Record<string, { name: string; icon_emoji: string }>
): string {
  const parts = bundle.slots
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((slot) => {
      const cat = catMap[slot.category_id];
      const catLabel = cat ? `${cat.icon_emoji} ${cat.name}` : "—";
      return `${slot.quantity}× ${catLabel}`.trim();
    });
  return parts.length > 0 ? parts.join(" · ") : "—";
}
