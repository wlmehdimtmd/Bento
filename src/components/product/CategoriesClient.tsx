"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { createClient } from "@/lib/supabase/client";

interface AdminCategoryActions {
  onSave: (payload: CategorySavePayload, isEdit: boolean, existingId?: string) => Promise<CategoryRow>;
  onDelete: (id: string) => Promise<void>;
}

interface CategoriesClientProps {
  shopId: string;
  initialCategories: (CategoryRow & { productCount: number })[];
  adminActions?: AdminCategoryActions;
}

type CategoryWithCount = CategoryRow & { productCount: number };

export function CategoriesClient({
  shopId,
  initialCategories,
  adminActions,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] =
    useState<CategoryWithCount[]>(initialCategories);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithCount | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Template picker
  const [templateOpen, setTemplateOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function handleTemplateImport(data: ImportData) {
    const supabase = createClient();
    const existing = categories.map((c) => ({ id: c.id, name: c.name }));
    const { categoryCount, productCount } = await importTemplatesIntoShop(supabase, shopId, data, existing);
    toast.success(`${categoryCount} catégorie${categoryCount !== 1 ? "s" : ""} et ${productCount} produit${productCount !== 1 ? "s" : ""} importés !`);
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
        (c.description ?? "").toLowerCase().includes(q)
    );
  }, [sorted, search]);

  const listSummaryText = useMemo(() => {
    const q = search.trim();
    const n = displayed.length;
    const total = sorted.length;
    if (q) {
      return (
        <>
          {n} résultat{n !== 1 ? "s" : ""} pour &laquo;{q}&raquo;
          {total !== n && (
            <span className="text-muted-foreground/80"> ({total} au total)</span>
          )}
        </>
      );
    }
    return (
      <>
        {total} catégorie{total !== 1 ? "s" : ""}
      </>
    );
  }, [displayed.length, search, sorted.length]);

  const nextOrder = sorted.length > 0
    ? Math.max(...sorted.map((c) => c.display_order)) + 1
    : 0;

  // ── Handlers ────────────────────────────────────────────────

  function openCreate() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEdit(cat: CategoryWithCount) {
    setEditingCategory(cat);
    setFormOpen(true);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  function handleFormSuccess(updated: CategoryRow) {
    setFormOpen(false);
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
      toast.success(newValue ? "Catégorie activée" : "Catégorie désactivée");
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
      toast.error("Erreur lors de la réorganisation.");
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
        toast.success("Catégorie supprimée.");
      } catch {
        toast.error("Erreur lors de la suppression.");
      } finally {
        setIsDeleting(false);
        setDeleteOpen(false);
        setDeletingId(null);
      }
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", deletingId);

    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      toast.error(error.message);
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== deletingId));
      toast.success("Catégorie supprimée.");
      router.refresh();
    }

    setDeletingId(null);
  }

  const deletingCat = categories.find((c) => c.id === deletingId);

  const globalIndex = (id: string) => sorted.findIndex((c) => c.id === id);

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher une catégorie…"
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
              <ImportMenuDropdown onImportTemplate={() => setTemplateOpen(true)} />
            )}
            <Button
              onClick={openCreate}
              style={{ backgroundColor: "var(--color-bento-accent)" }}
              className="text-white hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </div>
        </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Aucune catégorie. Créez-en une pour commencer.
          </p>
        </div>
      )}

      {sorted.length > 0 && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Aucune catégorie ne correspond à votre recherche.
          </p>
        </div>
      )}

      {displayed.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="hidden md:table-cell max-w-[200px]">
                  Description
                </TableHead>
                <TableHead className="text-right hidden sm:table-cell w-28">
                  Produits
                </TableHead>
                {!adminActions && (
                  <TableHead className="text-center w-24">Actif</TableHead>
                )}
                {!adminActions && (
                  <TableHead className="text-center w-24">Ordre</TableHead>
                )}
                <TableHead className="text-right w-24">Actions</TableHead>
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
                          aria-label={cat.is_active ? "Désactiver" : "Activer"}
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
                            aria-label="Monter"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleReorder(cat, "down")}
                            disabled={gi >= sorted.length - 1}
                            aria-label="Descendre"
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
                          aria-label="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDelete(cat.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Supprimer"
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

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle>
            {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <CategoryForm
            shopId={shopId}
            nextOrder={nextOrder}
            initialData={editingCategory ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
            onSave={adminActions?.onSave}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer la catégorie</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>&laquo;{deletingCat?.name}&raquo;</strong> ?
            {(deletingCat?.productCount ?? 0) > 0 && (
              <span className="mt-1 block text-destructive">
                ⚠️ Cette catégorie contient{" "}
                <strong>{deletingCat!.productCount} produit{deletingCat!.productCount > 1 ? "s" : ""}</strong>{" "}
                qui seront également supprimés.
              </span>
            )}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
