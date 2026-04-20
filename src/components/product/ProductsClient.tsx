"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Search,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ProductForm, type ProductRow, type ProductSavePayload } from "./ProductForm";
import { TagBadge } from "./TagBadge";
import { ImportMenuDropdown } from "./ImportMenuDropdown";
import { TemplatePickerDialog, importTemplatesIntoShop, type ImportData } from "@/components/templates/TemplatePickerDialog";
import { PasteJsonImportDialog } from "@/components/import/PasteJsonImportDialog";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  icon_emoji: string;
}

interface AdminProductActions {
  onSave: (payload: ProductSavePayload, isEdit: boolean, existingId?: string) => Promise<ProductRow>;
  onDelete: (id: string) => Promise<void>;
}

interface ProductsClientProps {
  shopId: string;
  categories: CategoryOption[];
  initialProducts: (ProductRow & { categoryName: string })[];
  adminActions?: AdminProductActions;
}

type ProductWithCategory = ProductRow & { categoryName: string };

export function ProductsClient({
  shopId,
  categories,
  initialProducts,
  adminActions,
}: ProductsClientProps) {
  const router = useRouter();
  const [products, setProducts] =
    useState<ProductWithCategory[]>(initialProducts);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithCategory | null>(null);
  const [formSubView, setFormSubView] = useState<"main" | "photo" | "tags">("main");
  const [defaultCatId, setDefaultCatId] = useState<string | undefined>();

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Template picker
  const [templateOpen, setTemplateOpen] = useState(false);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const isMobile = useIsMobile(768);

  async function handleTemplateImport(data: ImportData) {
    const supabase = createClient();
    const existing = categories.map((c) => ({ id: c.id, name: c.name }));
    const { productCount } = await importTemplatesIntoShop(supabase, shopId, data, existing);
    toast.success(`${productCount} produit${productCount !== 1 ? "s" : ""} importé${productCount !== 1 ? "s" : ""} !`);
    router.refresh();
  }

  const nextOrder = useMemo(
    () =>
      products.length > 0
        ? Math.max(...products.map((p) => p.display_order)) + 1
        : 0,
    [products]
  );

  // ── Filtered list ────────────────────────────────────────────
  const categoryFilterItems = useMemo(() => {
    const items: Record<string, string> = { all: "Toutes les catégories" };
    for (const c of categories) {
      items[c.id] = `${c.icon_emoji} ${c.name}`;
    }
    return items;
  }, [categories]);

  const filtered = useMemo(() => {
    return products
      .filter((p) =>
        categoryFilter === "all" ? true : p.category_id === categoryFilter
      )
      .filter((p) =>
        search.trim()
          ? p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description ?? "").toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) => a.display_order - b.display_order);
  }, [products, categoryFilter, search]);

  const listSummaryText = useMemo(() => {
    const q = search.trim();
    const n = filtered.length;
    const catName =
      categoryFilter !== "all"
        ? categories.find((c) => c.id === categoryFilter)?.name
        : null;
    if (q) {
      return (
        <>
          {n} produit{n !== 1 ? "s" : ""}
          {catName && (
            <>
              {" "}
              dans <strong>{catName}</strong>
            </>
          )}
          {" "}
          correspondant à &laquo;{q}&raquo;
        </>
      );
    }
    return (
      <>
        {n} produit{n !== 1 ? "s" : ""}
        {catName && (
          <>
            {" "}
            dans <strong>{catName}</strong>
          </>
        )}
      </>
    );
  }, [filtered.length, search, categoryFilter, categories]);

  // ── Handlers ────────────────────────────────────────────────

  function openCreate() {
    setEditingProduct(null);
    setDefaultCatId(categoryFilter !== "all" ? categoryFilter : undefined);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openEdit(p: ProductWithCategory) {
    setEditingProduct(p);
    setFormSubView("main");
    setFormOpen(true);
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  function handleFormSuccess(updated: ProductRow) {
    setFormOpen(false);
    setFormSubView("main");
    const catName =
      categories.find((c) => c.id === updated.category_id)?.name ?? "";

    setProducts((prev) => {
      const exists = prev.find((p) => p.id === updated.id);
      if (exists) {
        return prev.map((p) =>
          p.id === updated.id ? { ...updated, categoryName: catName } : p
        );
      }
      return [...prev, { ...updated, categoryName: catName }];
    });
    router.refresh();
  }

  async function handleToggleAvailable(p: ProductWithCategory) {
    const newValue = !p.is_available;
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, is_available: newValue } : x))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ is_available: newValue })
      .eq("id", p.id);

    if (error) {
      toast.error(error.message);
      setProducts((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, is_available: p.is_available } : x
        )
      );
    } else {
      toast.success(newValue ? "Produit activé" : "Produit désactivé");
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    if (adminActions) {
      try {
        await adminActions.onDelete(deletingId);
        setProducts((prev) => prev.filter((p) => p.id !== deletingId));
        toast.success("Produit supprimé.");
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
      .from("products")
      .delete()
      .eq("id", deletingId);

    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      toast.error(error.message);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== deletingId));
      toast.success("Produit supprimé.");
      router.refresh();
    }
    setDeletingId(null);
  }

  const deletingProduct = products.find((p) => p.id === deletingId);

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        {/* Ligne 1 : recherche + filtre catégorie */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={categoryFilter}
            items={categoryFilterItems}
            onValueChange={(val) => {
              if (val) setCategoryFilter(val);
            }}
          >
            <SelectTrigger className="w-48 shrink-0">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon_emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ligne 2 : résumé + actions */}
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
              style={{ backgroundColor: "var(--color-bento-accent)" }}
              className="text-white hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouveau produit
            </Button>
          </div>
        </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {products.length === 0
              ? "Aucun produit. Créez-en un pour commencer."
              : "Aucun produit ne correspond aux filtres."}
          </p>
          {products.length === 0 && (
            <Button variant="outline" onClick={openCreate}>
              Créer un produit
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                {!adminActions && <TableHead className="text-center w-20">Dispo</TableHead>}
                <TableHead className="text-right w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className={!p.is_available ? "opacity-50" : undefined}>
                  {/* Thumbnail */}
                  <TableCell className="py-2">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm">
                          🍽️
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="py-2">
                    <p className="font-medium truncate max-w-[180px]">{p.name}</p>
                    {p.option_label && (
                      <p className="text-xs text-muted-foreground truncate">
                        Option : {p.option_label}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-xs text-muted-foreground truncate hidden sm:block max-w-[200px]">
                        {p.description}
                      </p>
                    )}
                  </TableCell>

                  {/* Category */}
                  <TableCell className="hidden sm:table-cell py-2">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {p.categoryName}
                    </Badge>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right py-2 font-medium tabular-nums">
                    {formatPrice(p.price)}
                  </TableCell>

                  {/* Tags */}
                  <TableCell className="hidden md:table-cell py-2">
                    <div className="flex flex-wrap gap-1 max-w-[160px]">
                      {(p.tags ?? []).slice(0, 4).map((t) => (
                        <TagBadge key={t} value={t} size="sm" />
                      ))}
                      {(p.tags ?? []).length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{p.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Toggle */}
                  {!adminActions && (
                    <TableCell className="text-center py-2">
                      <Switch
                        checked={p.is_available}
                        onCheckedChange={() => handleToggleAvailable(p)}
                        size="sm"
                        aria-label={p.is_available ? "Désactiver" : "Activer"}
                      />
                    </TableCell>
                  )}

                  {/* Actions */}
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(p)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDelete(p.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Supprimer"
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
        mode="products"
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
          <DrawerContent className="flex max-h-[92vh] flex-col overflow-hidden">
            <DrawerHeader className={formSubView !== "main" ? "flex-row items-center gap-2" : undefined}>
              {formSubView !== "main" ? (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFormSubView("main")} aria-label="Retour">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>
                {formSubView === "photo"
                  ? "Photo du produit"
                  : formSubView === "tags"
                    ? "Allergènes et labels"
                    : editingProduct
                      ? "Modifier le produit"
                      : "Nouveau produit"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              <ProductForm
                categories={categories}
                nextOrder={nextOrder}
                defaultCategoryId={defaultCatId}
                initialData={editingProduct ?? undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => setFormOpen(false)}
                onSave={adminActions?.onSave}
                subViewOverride={formSubView}
                onSubViewChange={setFormSubView}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetContent side="right" className="w-full sm:max-w-2xl h-full overflow-hidden">
            <SheetHeader>
              <SheetTitle>
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </SheetTitle>
            </SheetHeader>
            <div className="h-full min-h-0 overflow-y-auto px-4 pb-4">
              <ProductForm
                categories={categories}
                nextOrder={nextOrder}
                defaultCategoryId={defaultCatId}
                initialData={editingProduct ?? undefined}
                onSuccess={handleFormSuccess}
                onCancel={() => setFormOpen(false)}
                onSave={adminActions?.onSave}
                sheetCtasFullWidth
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Supprimer le produit</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>&laquo;{deletingProduct?.name}&raquo;</strong> ?
            Cette action est irréversible.
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
