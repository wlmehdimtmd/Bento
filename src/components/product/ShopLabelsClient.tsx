"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { TranslatableTabs } from "@/components/catalog/TranslatableTabs";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import {
  shopLabelCompletion,
  shopLabelDefaultFormValues,
  shopLabelFormSchema,
  shopLabelFormToSavePayload,
  type ShopLabelFormValues,
} from "@/lib/catalogFormAdapters";
import { getDefaultCatalogLanguageCode, type TabCompletionStatus } from "@/lib/catalogLanguages";
import { pickLocalized } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  CatalogDashboardPageHeader,
  type CatalogDashboardPageIntro,
} from "@/components/dashboard/CatalogDashboardPageHeader";

interface ShopLabelsClientProps {
  shopId: string;
  initialLabels: ShopLabelOption[];
  existingProductTags: string[];
  catalogPageHeader?: CatalogDashboardPageIntro;
}

const DEFAULT_COLOR = "#1d4ed8";

function ShopLabelFormFields({
  register,
  errors,
  isSaving,
  catalogTab,
  setCatalogTab,
  completionByLang,
  completeCount,
  onCopyFromFr,
  tr,
}: {
  register: UseFormRegister<ShopLabelFormValues>;
  errors: FieldErrors<ShopLabelFormValues>;
  isSaving: boolean;
  catalogTab: string;
  setCatalogTab: (v: string) => void;
  completionByLang: Record<string, TabCompletionStatus>;
  completeCount: number;
  onCopyFromFr: () => void;
  tr: (fr: string, en: string) => string;
}) {
  return (
    <div className="space-y-3">
      <TranslatableTabs
        value={catalogTab}
        onValueChange={setCatalogTab}
        completionByLang={completionByLang}
        completeCount={completeCount}
        sectionTitle={tr("Contenu multilingue", "Multilingual content")}
        footerSlot={
          catalogTab !== "fr" ? (
            <Button type="button" variant="outline" size="sm" onClick={onCopyFromFr} disabled={isSaving}>
              {tr("Copier depuis FR (champs vides uniquement)", "Copy from FR (empty fields only)")}
            </Button>
          ) : null
        }
      >
        {(langCode) =>
          langCode === "fr" ? (
            <div className="space-y-1.5">
              <label htmlFor="shop-label-fr" className="text-sm font-medium">
                {tr("Nom", "Name")} *
              </label>
              <Input
                id="shop-label-fr"
                {...register("translations.fr.label")}
                placeholder={tr("Ex: Nouveauté", "Ex: New")}
                disabled={isSaving}
                autoFocus
              />
              {errors.translations?.fr?.label && (
                <p className="text-xs text-destructive">{errors.translations.fr.label.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="shop-label-en" className="text-sm font-medium">
                {tr("Nom (anglais)", "Name (English)")}
              </label>
              <Input
                id="shop-label-en"
                {...register("translations.en.label")}
                placeholder={tr("Optionnel", "Optional")}
                disabled={isSaving}
              />
              {errors.translations?.en?.label && (
                <p className="text-xs text-destructive">{errors.translations.en.label.message}</p>
              )}
            </div>
          )
        }
      </TranslatableTabs>
    </div>
  );
}

export function ShopLabelsClient({
  shopId,
  initialLabels,
  existingProductTags,
  catalogPageHeader,
}: ShopLabelsClientProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const router = useRouter();
  const supabase = createClient();
  const isMobile = useIsMobile(768);
  const isCompactTable = useIsMobile(1120);

  const [labels, setLabels] = useState<ShopLabelOption[]>(initialLabels);
  const [labelEditorOpen, setLabelEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ShopLabelOption | null>(null);
  const [catalogTab, setCatalogTab] = useState(getDefaultCatalogLanguageCode());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<ShopLabelOption | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ShopLabelFormValues>({
    resolver: zodResolver(shopLabelFormSchema),
    defaultValues: shopLabelDefaultFormValues(),
  });

  const watched = watch();
  const completionByLang = shopLabelCompletion(watched);
  const completeCount = Object.values(completionByLang).filter((s) => s === "complete").length;

  useEffect(() => {
    if (!labelEditorOpen) return;
    reset(
      shopLabelDefaultFormValues(
        editing
          ? {
              label: editing.label,
              label_fr: editing.label_fr,
              label_en: editing.label_en,
            }
          : undefined
      )
    );
    setCatalogTab(getDefaultCatalogLanguageCode());
  }, [labelEditorOpen, editing, reset]);

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
    setEditing(null);
    setLabelEditorOpen(true);
  }

  function openEdit(item: ShopLabelOption) {
    setEditing(item);
    setLabelEditorOpen(true);
  }

  function openDelete(item: ShopLabelOption) {
    setDeleting(item);
    setDeleteOpen(true);
  }

  function copyFromFr() {
    if (catalogTab === "fr") return;
    const fr = (getValues("translations.fr.label") ?? "").trim();
    if (catalogTab === "en") {
      const en = (getValues("translations.en.label") ?? "").trim();
      if (!en && fr) {
        setValue("translations.en.label", fr, { shouldValidate: true, shouldDirty: true });
      }
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = shopLabelFormToSavePayload(values);
    const value = normalizeLabelValue(payload.label_fr);
    if (!value) {
      toast.error(tr("Nom invalide pour générer une clé de label.", "Invalid name to generate label key."));
      return;
    }

    const duplicate = sorted.find(
      (item) => item.value === value && item.id !== editing?.id
    );
    if (duplicate) {
      toast.error(tr("Un label avec ce nom existe déjà.", "A label with this name already exists."));
      return;
    }

    setIsSaving(true);

    if (editing?.id) {
      const { data, error } = await supabase
        .from("shop_labels")
        .update({
          label: payload.label,
          label_fr: payload.label_fr,
          label_en: payload.label_en,
          value,
          color: DEFAULT_COLOR,
        })
        .eq("id", editing.id)
        .select("id, shop_id, value, label, label_fr, label_en, color, display_order, created_at, updated_at")
        .single();

      setIsSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLabels((prev) =>
        prev.map((item) => (item.id === editing.id ? (data as ShopLabelOption) : item))
      );
      setLabelEditorOpen(false);
      toast.success(tr("Label mis à jour.", "Label updated."));
      router.refresh();
      return;
    }

    const { data, error } = await supabase
      .from("shop_labels")
      .insert({
        shop_id: shopId,
        label: payload.label,
        label_fr: payload.label_fr,
        label_en: payload.label_en,
        value,
        color: DEFAULT_COLOR,
        display_order: sorted.length,
      })
      .select("id, shop_id, value, label, label_fr, label_en, color, display_order, created_at, updated_at")
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
    setLabelEditorOpen(false);
    toast.success(tr("Label ajouté.", "Label added."));
    router.refresh();
  });

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
    toast.success(tr("Label supprimé.", "Label deleted."));
    router.refresh();
  }

  const editorTitle = editing?.id ? tr("Modifier le label", "Edit label") : tr("Nouveau label", "New label");
  const editorDescription = tr(
    "Ce label pourra être appliqué sur vos produits.",
    "This label can be applied to your products."
  );

  const primaryLabelCtaLabel = isMobile
    ? locale === "en"
      ? "New"
      : "Nouveau"
    : tr("Nouveau label", "New label");

  const formFields = (
    <ShopLabelFormFields
      register={register}
      errors={errors}
      isSaving={isSaving}
      catalogTab={catalogTab}
      setCatalogTab={setCatalogTab}
      completionByLang={completionByLang}
      completeCount={completeCount}
      onCopyFromFr={copyFromFr}
      tr={tr}
    />
  );

  const labelHeaderActions = (
    <Button
      onClick={openCreate}
      disabled={isAtLimit}
      style={{ backgroundColor: "var(--primary)" }}
      className="text-primary-foreground hover:opacity-90"
    >
      <Plus className="mr-1.5 h-4 w-4" />
      {primaryLabelCtaLabel}
    </Button>
  );

  const editorFooter = (
    <div className="flex w-full gap-2">
      <Button variant="outline" onClick={() => setLabelEditorOpen(false)} disabled={isSaving} className="flex-1">
        {tr("Annuler", "Cancel")}
      </Button>
      <Button
        type="button"
        onClick={() => void onSubmit()}
        disabled={isSaving}
        style={{ backgroundColor: "var(--primary)" }}
        className="flex-1 text-primary-foreground hover:opacity-90"
      >
        {isSaving ? tr("Enregistrement...", "Saving...") : tr("Enregistrer", "Save")}
      </Button>
    </div>
  );

  return (
    <>
      {catalogPageHeader ? (
        <CatalogDashboardPageHeader
          pageTitle={catalogPageHeader.pageTitle}
          introCopy={catalogPageHeader.introCopy}
          titleMeta={`${count} / ${MAX_SHOP_LABELS} ${tr("labels", "labels")}`}
          actions={labelHeaderActions}
        />
      ) : null}

      <div className={catalogPageHeader ? "mt-6 space-y-3" : "space-y-3"}>
        {!catalogPageHeader ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {count} / {MAX_SHOP_LABELS} {tr("labels", "labels")}
            </p>
            {labelHeaderActions}
          </div>
        ) : null}

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {tr("Aucun label personnalisé pour le moment.", "No custom labels yet.")}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr("Label", "Label")}</TableHead>
                  <TableHead className={isCompactTable ? "hidden" : "hidden sm:table-cell"}>{tr("Clé", "Key")}</TableHead>
                  {!isCompactTable && <TableHead className="w-24 text-right">{tr("Actions", "Actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => openEdit(item)}>
                    <TableCell>
                      <Badge variant="secondary">
                        {pickLocalized(locale, {
                          fr: item.label_fr,
                          en: item.label_en,
                          legacy: item.label,
                        }) ?? item.label}
                      </Badge>
                    </TableCell>
                    <TableCell className={isCompactTable ? "hidden" : "hidden sm:table-cell"}>
                      <code className="text-xs text-muted-foreground">{item.value}</code>
                    </TableCell>
                    {!isCompactTable && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                          aria-label={tr("Modifier", "Edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDelete(item);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label={tr("Supprimer", "Delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{tr("Tags détectés dans les produits", "Detected tags in products")}</p>
            <p className="text-xs text-muted-foreground">
              {existingProductTags.length}{" "}
              {tr("tag(s) trouvé(s) dans la base pour cette boutique.", "tag(s) found in this shop database.")}
            </p>
          </div>

          {existingProductTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tr("Aucun tag présent dans les produits.", "No tags found in products.")}
            </p>
          ) : (
            <div className="space-y-2">
              {unmappedProductTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {tr("Non mappés", "Unmapped")} ({unmappedProductTags.length})
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
                    {tr("Mappés", "Mapped")} ({mappedProductTags.length})
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

      {isMobile ? (
        <Drawer open={labelEditorOpen} onOpenChange={setLabelEditorOpen}>
          <DrawerContent className="mt-0 flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden rounded-none border-0 p-0 data-[vaul-drawer-direction=bottom]:max-h-[100dvh] [&>div:first-child]:hidden">
            <DrawerHeader className="shrink-0 border-b border-border text-left">
              <DrawerTitle>{editorTitle}</DrawerTitle>
              <DrawerDescription>{editorDescription}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{formFields}</div>
            <DrawerFooter className="shrink-0 border-t border-border">{editorFooter}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={labelEditorOpen} onOpenChange={setLabelEditorOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>{editorTitle}</DialogTitle>
            <DialogDescription>{editorDescription}</DialogDescription>
            {formFields}
            <DialogFooter className="gap-2 sm:gap-0">{editorFooter}</DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
