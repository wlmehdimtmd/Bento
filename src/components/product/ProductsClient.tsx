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
import type { ProductLabelOption } from "@/lib/shop-labels";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  CatalogDashboardPageHeader,
  type CatalogDashboardPageIntro,
} from "@/components/dashboard/CatalogDashboardPageHeader";

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
  shopLabels: ProductLabelOption[];
  adminActions?: AdminProductActions;
  catalogPageHeader?: CatalogDashboardPageIntro;
}

type ProductWithCategory = ProductRow & { categoryName: string };

export function ProductsClient({
  shopId,
  categories,
  initialProducts,
  shopLabels,
  adminActions,
  catalogPageHeader,
}: ProductsClientProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
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
    toast.success(
      locale === "en"
        ? `${productCount} product${productCount !== 1 ? "s" : ""} imported!`
        : `${productCount} produit${productCount !== 1 ? "s" : ""} importé${productCount !== 1 ? "s" : ""} !`
    );
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
    const items: Record<string, string> = { all: tr("Toutes les catégories", "All categories") };
    for (const c of categories) {
      items[c.id] = `${c.icon_emoji} ${c.name}`;
    }
    return items;
  }, [categories, tr]);

  const filtered = useMemo(() => {
    return products
      .filter((p) =>
        categoryFilter === "all" ? true : p.category_id === categoryFilter
      )
      .filter((p) =>
        search.trim()
          ? p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (p.name_en ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (p.description_en ?? "").toLowerCase().includes(search.toLowerCase())
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
          {n} {tr(`produit${n !== 1 ? "s" : ""}`, `product${n !== 1 ? "s" : ""}`)}
          {catName && (
            <>
              {" "}
              {tr("dans", "in")} <strong>{catName}</strong>
            </>
          )}
          {" "}
          {tr("correspondant à", "matching")} &laquo;{q}&raquo;
        </>
      );
    }
    return (
      <>
        {n} {tr(`produit${n !== 1 ? "s" : ""}`, `product${n !== 1 ? "s" : ""}`)}
        {catName && (
          <>
            {" "}
            {tr("dans", "in")} <strong>{catName}</strong>
          </>
        )}
      </>
    );
  }, [filtered.length, search, categoryFilter, categories, tr]);

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
      toast.success(newValue ? tr("Produit activé", "Product enabled") : tr("Produit désactivé", "Product disabled"));
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);

    if (adminActions) {
      try {
        await adminActions.onDelete(deletingId);
        setProducts((prev) => prev.filter((p) => p.id !== deletingId));
        toast.success(tr("Produit supprimé.", "Product deleted."));
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
      .from("products")
      .delete()
      .eq("id", deletingId);

    setIsDeleting(false);
    setDeleteOpen(false);

    if (error) {
      toast.error(error.message);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== deletingId));
      toast.success(tr("Produit supprimé.", "Product deleted."));
      router.refresh();
    }
    setDeletingId(null);
  }

  const deletingProduct = products.find((p) => p.id === deletingId);

  const primaryCreateCtaLabel = isMobile
    ? locale === "en"
      ? "New"
      : "Nouveau"
    : tr("Nouveau produit", "New product");

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
        {/* Ligne 1 : recherche + filtre catégorie */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={tr("Rechercher un produit…", "Search a product...")}
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
              <SelectValue placeholder={tr("Toutes les catégories", "All categories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("Toutes les catégories", "All categories")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon_emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ligne 2 : résumé (+ actions si pas d’en-tête page) */}
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
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {products.length === 0
              ? tr("Aucun produit. Créez-en un pour commencer.", "No products. Create one to get started.")
              : tr("Aucun produit ne correspond aux filtres.", "No products match the filters.")}
          </p>
          {products.length === 0 && (
            <Button variant="outline" onClick={openCreate}>
              {tr("Créer un produit", "Create product")}
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
                <TableHead>{tr("Produit", "Product")}</TableHead>
                <TableHead className="hidden sm:table-cell">{tr("Catégorie", "Category")}</TableHead>
                <TableHead className="text-right">{tr("Prix", "Price")}</TableHead>
                <TableHead className="hidden md:table-cell">{tr("Tags", "Tags")}</TableHead>
                {!adminActions && <TableHead className="text-center w-20">{tr("Dispo", "Avail.")}</TableHead>}
                <TableHead className="text-right w-20">{tr("Actions", "Actions")}</TableHead>
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
                        {tr("Option", "Option")} : {p.option_label}
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
                        <TagBadge key={t} value={t} size="sm" labels={shopLabels} />
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
                        aria-label={p.is_available ? tr("Désactiver", "Disable") : tr("Activer", "Enable")}
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
                        aria-label={tr("Modifier", "Edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDelete(p.id)}
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
                {formSubView === "photo"
                  ? tr("Photo du produit", "Product photo")
                  : formSubView === "tags"
                    ? tr("Allergènes et labels", "Allergens and labels")
                    : editingProduct
                      ? tr("Modifier le produit", "Edit product")
                      : tr("Nouveau produit", "New product")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
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
                labels={shopLabels}
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
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setFormSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>
                {formSubView === "photo"
                  ? tr("Photo du produit", "Product photo")
                  : formSubView === "tags"
                    ? tr("Allergènes et labels", "Allergens and labels")
                    : editingProduct
                      ? tr("Modifier le produit", "Edit product")
                      : tr("Nouveau produit", "New product")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
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
                labels={shopLabels}
                stickySheetActions
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>{tr("Supprimer le produit", "Delete product")}</DialogTitle>
          <DialogDescription>
            {tr("Êtes-vous sûr de vouloir supprimer", "Are you sure you want to delete")}{" "}
            <strong>&laquo;{deletingProduct?.name}&raquo;</strong> ?
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
