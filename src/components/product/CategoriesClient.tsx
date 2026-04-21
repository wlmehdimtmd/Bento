"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Package,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CategoryForm, type CategoryRow, type CategorySavePayload } from "./CategoryForm";
import { ImportMenuDropdown } from "./ImportMenuDropdown";
import { TemplatePickerDialog, importTemplatesIntoShop, type ImportData } from "@/components/templates/TemplatePickerDialog";
import { PasteJsonImportDialog } from "@/components/import/PasteJsonImportDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  CatalogDashboardPageHeader,
  type CatalogDashboardPageIntro,
} from "@/components/dashboard/CatalogDashboardPageHeader";

interface AdminCategoryActions {
  onSave: (payload: CategorySavePayload, isEdit: boolean, existingId?: string) => Promise<CategoryRow>;
  onDelete: (id: string) => Promise<void>;
}

interface CategoriesClientProps {
  shopId: string;
  initialCategories: (CategoryRow & { productCount: number })[];
  adminActions?: AdminCategoryActions;
  /** Dashboard marchand : titre + actions sur une ligne, puis sous-titres. */
  catalogPageHeader?: CatalogDashboardPageIntro;
}

type CategoryWithCount = CategoryRow & { productCount: number };

export function CategoriesClient({
  shopId,
  initialCategories,
  adminActions,
  catalogPageHeader,
}: CategoriesClientProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const [categories, setCategories] =
    useState<CategoryWithCount[]>(initialCategories);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithCount | null>(null);
  const [formSubView, setFormSubView] = useState<"main" | "icon">("main");

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Template picker
  const [templateOpen, setTemplateOpen] = useState(false);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile(768);

  async function handleTemplateImport(data: ImportData) {
    const supabase = createClient();
    const existing = categories.map((c) => ({ id: c.id, name: c.name }));
    const { categoryCount, productCount } = await importTemplatesIntoShop(supabase, shopId, data, existing);
    toast.success(
      locale === "en"
        ? `${categoryCount} categor${categoryCount !== 1 ? "ies" : "y"} and ${productCount} product${productCount !== 1 ? "s" : ""} imported!`
        : `${categoryCount} catégorie${categoryCount !== 1 ? "s" : ""} et ${productCount} produit${productCount !== 1 ? "s" : ""} importés !`
    );
    router.refresh();
  }

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.display_order - b.display_order),
    [categories]
  );

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.name_en ?? "").toLowerCase().includes(q) ||
        (c.description_en ?? "").toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const listSummaryText = useMemo(() => {
    const q = search.trim();
    const n = displayed.length;
    const total = sorted.length;
    if (q) {
      return (
        <>
          {locale === "en"
            ? `${n} result${n !== 1 ? "s" : ""} for`
            : `${n} résultat${n !== 1 ? "s" : ""} pour`}{" "}
          &laquo;{q}&raquo;
          {total !== n && (
            <span className="text-muted-foreground/80">
              {" "}
              ({total} {tr("au total", "total")})
            </span>
          )}
        </>
      );
    }
    return (
      <>
        {total} {tr(`catégorie${total !== 1 ? "s" : ""}`, `categor${total !== 1 ? "ies" : "y"}`)}
      </>
    );
  }, [displayed.length, locale, search, sorted.length, tr]);

  const nextOrder = sorted.length > 0
    ? Math.max(...sorted.map((c) => c.display_order)) + 1
    : 0;

  // ── Handlers ────────────────────────────────────────────────

  function openCreate() {
    setEditingCategory(null);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openEdit(cat: CategoryWithCount) {
    setEditingCategory(cat);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  function handleFormSuccess(updated: CategoryRow) {
    setFormOpen(false);
    setFormSubView("main");
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === updated.id);
      if (exists) {
        return prev.map((c) =>
          c.id === updated.id ? { ...updated, productCount: c.productCount } : c
        );
      }
      return [...prev, { ...updated, productCount: 0 }];
    });
    router.refresh();
  }

  async function handleToggleActive(cat: CategoryWithCount) {
    const newValue = !cat.is_active;
    // Optimistic
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: newValue } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({ is_active: newValue })
      .eq("id", cat.id);

    if (error) {
      toast.error(error.message);
      // Revert
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: cat.is_active } : c))
      );
    } else {
      toast.success(newValue ? tr("Catégorie activée", "Category enabled") : tr("Catégorie désactivée", "Category disabled"));
      router.refresh();
    }
  }

  async function handleReorder(cat: CategoryWithCount, dir: "up" | "down") {
    const list = [...sorted];
    const idx = list.findIndex((c) => c.id === cat.id);
    const targetIdx = dir === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const target = list[targetIdx];
    const newOrderA = target.display_order;
    const newOrderB = cat.display_order;

    // Optimistic swap
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === cat.id) return { ...c, display_order: newOrderA };
        if (c.id === target.id) return { ...c, display_order: newOrderB };
        return c;
      })
    );

    const supabase = createClient();
    const [r1, r2] = await Promise.all([
      supabase
        .from("categories")
        .update({ display_order: newOrderA })
        .eq("id", cat.id),
      supabase
        .from("categories")
        .update({ display_order: newOrderB })
        .eq("id", target.id),
    ]);

    if (r1.error || r2.error) {
      toast.error(tr("Erreur lors de la réorganisation.", "Error while reordering."));
      // Revert
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === cat.id) return { ...c, display_order: newOrderB };
          if (c.id === target.id) return { ...c, display_order: newOrderA };
          return c;
        })
      );
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    if (adminActions) {
      try {
        await adminActions.onDelete(deletingId);
        setCategories((prev) => prev.filter((c) => c.id !== deletingId));
        toast.success(tr("Catégorie supprimée.", "Category deleted."));
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
    const { error: slotsError } = await supabase
      .from("bundle_slots")
      .delete()
      .eq("category_id", deletingId);

    if (slotsError) {
      setIsDeleting(false);
      toast.error(tr("Impossible de supprimer les formules liées à cette catégorie.", "Cannot delete bundles linked to this category."));
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", deletingId);

    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      if (error.code === "23503") {
        toast.error(tr("Cette catégorie est encore utilisée ailleurs (formules, produits ou commandes).", "This category is still used elsewhere (bundles, products or orders)."));
      } else {
        toast.error(error.message);
      }
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== deletingId));
      toast.success(tr("Catégorie supprimée.", "Category deleted."));
      router.refresh();
    }

    setDeletingId(null);
  }

  const deletingCat = categories.find((c) => c.id === deletingId);

  const globalIndex = (id: string) => sorted.findIndex((c) => c.id === id);

  const primaryCreateCtaLabel = isMobile
    ? locale === "en"
      ? "New"
      : "Nouvelle"
    : tr("Nouvelle catégorie", "New category");

  const headerActions = (
    <>
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
        {primaryCreateCtaLabel}
      </Button>
    </>
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      {catalogPageHeader ? (
        <CatalogDashboardPageHeader
          pageTitle={catalogPageHeader.pageTitle}
          introCopy={catalogPageHeader.introCopy}
          actions={headerActions}
        />
      ) : null}

      <div className={catalogPageHeader ? "mt-6 space-y-3" : "space-y-3"}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={tr("Rechercher une catégorie…", "Search a category...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div
          className={
            catalogPageHeader
              ? "flex flex-wrap items-center gap-3"
              : "flex flex-wrap items-center justify-between gap-3"
          }
        >
          <p className="text-sm text-muted-foreground min-w-0 flex-1">
            {listSummaryText}
          </p>
          {!catalogPageHeader ? (
            <div className="flex gap-2 shrink-0">{headerActions}</div>
          ) : null}
        </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {tr("Aucune catégorie. Créez-en une pour commencer.", "No categories. Create one to get started.")}
          </p>
        </div>
      )}

      {sorted.length > 0 && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {tr("Aucune catégorie ne correspond à votre recherche.", "No category matches your search.")}
          </p>
        </div>
      )}

      {displayed.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{tr("Catégorie", "Category")}</TableHead>
                <TableHead className="hidden md:table-cell max-w-[200px]">
                  {tr("Description", "Description")}
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell w-28">
                  {tr("Produits", "Products")}
                </TableHead>
                {!adminActions && (
                  <TableHead className="text-center w-24">{tr("Actif", "Active")}</TableHead>
                )}
                {!adminActions && (
                  <TableHead className="text-center w-24">{tr("Ordre", "Order")}</TableHead>
                )}
                <TableHead className="text-right w-24">{tr("Actions", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((cat) => {
                const gi = globalIndex(cat.id);
                return (
                  <TableRow
                    key={cat.id}
                    className={!cat.is_active ? "opacity-50" : undefined}
                  >
                    <TableCell className="py-2">
                      <span className="text-2xl leading-none" aria-hidden>
                        {cat.icon_emoji}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <p className="font-medium truncate max-w-[200px]">{cat.name}</p>
                      <p className="text-xs text-muted-foreground truncate md:hidden max-w-[180px]">
                        {cat.description ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="py-2 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-[220px]">
                        {cat.description ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right py-2 hidden sm:table-cell tabular-nums">
                      {cat.productCount}
                    </TableCell>
                    {!adminActions && (
                      <TableCell className="text-center py-2">
                        <Switch
                          checked={cat.is_active}
                          onCheckedChange={() => handleToggleActive(cat)}
                          size="sm"
                          aria-label={cat.is_active ? tr("Désactiver", "Disable") : tr("Activer", "Enable")}
                        />
                      </TableCell>
                    )}
                    {!adminActions && (
                      <TableCell className="text-center py-2">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleReorder(cat, "up")}
                            disabled={gi <= 0}
                            aria-label={tr("Monter", "Move up")}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleReorder(cat, "down")}
                            disabled={gi >= sorted.length - 1}
                            aria-label={tr("Descendre", "Move down")}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(cat)}
                          aria-label={tr("Modifier", "Edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(cat.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label={tr("Supprimer", "Delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      </div>

      <TemplatePickerDialog
        mode="categories"
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
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFormSubView("main")} aria-label={tr("Retour", "Back")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>
                {formSubView === "icon"
                  ? tr("Icône de la catégorie", "Category icon")
                  : editingCategory
                    ? tr("Modifier la catégorie", "Edit category")
                    : tr("Nouvelle catégorie", "New category")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <CategoryForm
                shopId={shopId}
                nextOrder={nextOrder}
                initialData={editingCategory ?? undefined}
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
            className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
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
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setFormSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>
                {formSubView === "icon"
                  ? tr("Icône de la catégorie", "Category icon")
                  : editingCategory
                    ? tr("Modifier la catégorie", "Edit category")
                    : tr("Nouvelle catégorie", "New category")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <CategoryForm
                shopId={shopId}
                nextOrder={nextOrder}
                initialData={editingCategory ?? undefined}
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Supprimer la catégorie", "Delete category")}</DialogTitle>
          <DialogDescription>
            {tr("Êtes-vous sûr de vouloir supprimer", "Are you sure you want to delete")}{" "}
            <strong>&laquo;{deletingCat?.name}&raquo;</strong> ?
            {(deletingCat?.productCount ?? 0) > 0 && (
              <span className="mt-1 block text-destructive">
                ⚠️ {tr("Cette catégorie contient", "This category contains")}{" "}
                <strong>
                  {deletingCat!.productCount}{" "}
                  {tr(
                    `produit${deletingCat!.productCount > 1 ? "s" : ""}`,
                    `product${deletingCat!.productCount > 1 ? "s" : ""}`
                  )}
                </strong>{" "}
                {tr("qui seront également supprimés.", "that will also be deleted.")}
              </span>
            )}
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
