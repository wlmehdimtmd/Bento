"use client";

import { useState, useRef, useEffect } from "react";
import { GripVertical, Pencil, Trash2, Plus, Check, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/useIsMobile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  is_active?: boolean;
  display_order: number;
}

interface OnboardingCategoriesStepProps {
  shopId: string;
  initialCategories: CategoryItem[];
  isPreview?: boolean;
  onCatalogChanged?: () => void;
}

export function OnboardingCategoriesStep({
  shopId,
  initialCategories,
  isPreview = false,
  onCatalogChanged,
}: OnboardingCategoriesStepProps) {
  const { locale } = useLocale();
  const tr = (fr: string, en: string) => (locale === "en" ? en : fr);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🍱");
  const [newDescription, setNewDescription] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formPresentation, setFormPresentation] = useState<"drawer" | "sheet">("sheet");
  const [subView, setSubView] = useState<"main" | "icon">("main");
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile(640);

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const CATEGORY_ICON_OPTIONS = [
    "🥗",
    "🍽️",
    "🍰",
    "🥤",
    "🍕",
    "🍔",
    "🍜",
    "🥩",
    "🐟",
    "🌮",
    "🍣",
    "🧁",
    "🍷",
    "🍺",
    "☕",
    "🌿",
    "🔥",
    "⭐",
  ] as const;

  function notify() {
    onCatalogChanged?.();
  }

  function previewId() {
    return `preview-cat-${crypto.randomUUID()}`;
  }

  async function startEdit(cat: CategoryItem) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditEmoji(cat.icon_emoji);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    if (isPreview) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: editName.trim(), icon_emoji: editEmoji || "🍱" } : c
        )
      );
      setEditingId(null);
      notify();
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim(), icon_emoji: editEmoji || "🍱" })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: editName.trim(), icon_emoji: editEmoji || "🍱" } : c
      )
    );
    setEditingId(null);
    notify();
  }

  async function deleteCategory(id: string) {
    if (isPreview) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      notify();
      return;
    }
    const { error: slotsError } = await supabase
      .from("bundle_slots")
      .delete()
      .eq("category_id", id);
    if (slotsError) {
      toast.error(tr("Impossible de supprimer les formules liées à cette catégorie.", "Unable to delete bundles linked to this category."));
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        toast.error(tr("Cette catégorie est encore utilisée ailleurs (formules, produits ou commandes).", "This category is still used elsewhere (bundles, products, or orders)."));
      } else {
        toast.error(error.message);
      }
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    notify();
  }

  async function addCategory() {
    if (!newName.trim()) return;
    const description = newDescription.trim().slice(0, 32);
    if (isPreview) {
      const order = categories.length;
      setCategories((prev) => [
        ...prev,
        {
          id: previewId(),
          name: newName.trim(),
          description: description || null,
          icon_emoji: newEmoji || "🍱",
          is_active: newIsActive,
          display_order: order,
        },
      ]);
      setNewName("");
      setNewEmoji("🍱");
      setNewDescription("");
      setNewIsActive(true);
      setCreateOpen(false);
      notify();
      return;
    }
    setSaving(true);
    const order = categories.length;
    const { data, error } = await supabase
      .from("categories")
      .insert({
        shop_id: shopId,
        name: newName.trim(),
        description: description || null,
        icon_emoji: newEmoji || "🍱",
        display_order: order,
        is_active: newIsActive,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories((prev) => [...prev, data as CategoryItem]);
    setNewName("");
    setNewEmoji("🍱");
    setNewDescription("");
    setNewIsActive(true);
    setCreateOpen(false);
    notify();
  }

  function closeCreatePanel() {
    setCreateOpen(false);
    setSubView("main");
    setNewName("");
    setNewEmoji("🍱");
    setNewDescription("");
    setNewIsActive(true);
  }

  async function reorder(newOrder: CategoryItem[]) {
    setCategories(newOrder);
    if (isPreview) {
      notify();
      return;
    }
    await Promise.all(
      newOrder.map((cat, i) =>
        supabase.from("categories").update({ display_order: i }).eq("id", cat.id)
      )
    );
    notify();
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOver(index);
  }

  function handleDrop(dropIndex: number) {
    const fromIndex = dragIndex.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOver(null);
      return;
    }
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    void reorder(reordered);
    dragIndex.current = null;
    setDragOver(null);
  }

  const iconPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 px-1 pb-4">
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
          {CATEGORY_ICON_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setNewEmoji(emoji)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-lg border text-xl transition-colors",
                newEmoji === emoji
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-border hover:border-muted-foreground"
              )}
              aria-label={tr(`Icône ${emoji}`, `Icon ${emoji}`)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-border px-1 py-3">
        <Button
          type="button"
          onClick={() => setSubView("main")}
          style={{ backgroundColor: "var(--primary)" }}
          className="w-full text-primary-foreground hover:opacity-90"
        >
          {tr("Valider", "Confirm")}
        </Button>
      </div>
    </div>
  );

  const createCategoryForm = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 px-1 pb-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{tr("Nom", "Name")}</p>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addCategory();
              if (e.key === "Escape") closeCreatePanel();
            }}
            placeholder={tr("Nom de la catégorie", "Category name")}
            autoFocus
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setSubView("icon")}
          className="h-12 w-full justify-between rounded-xl px-3 text-base"
        >
          <span className="flex items-center gap-2">
            <span>{tr("Icône", "Icon")}</span>
            <span className="text-xl leading-none">{newEmoji}</span>
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{tr("Descriptif", "Description")}</p>
            <span className="text-xs text-muted-foreground">{newDescription.length}/32</span>
          </div>
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value.slice(0, 32))}
            placeholder={tr("Ex: Nos meilleures spécialités", "Ex: Our best specialties")}
            maxLength={32}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">{tr("Catégorie active", "Active category")}</p>
            <p className="text-xs text-muted-foreground">{tr("Visible sur la vitrine publique", "Visible on public storefront")}</p>
          </div>
          <Switch
            checked={newIsActive}
            onCheckedChange={setNewIsActive}
            aria-label={newIsActive ? tr("Désactiver la catégorie", "Disable category") : tr("Activer la catégorie", "Enable category")}
          />
        </div>
      </div>

      <div className="sticky bottom-0 mt-auto border-t border-border px-1 py-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={closeCreatePanel} className="flex-1">
            {tr("Annuler", "Cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void addCategory()}
            disabled={saving || !newName.trim()}
            style={{ backgroundColor: "var(--primary)" }}
            className="flex-1 text-primary-foreground hover:opacity-90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("Ajouter", "Add")}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pt-2">
      <OnboardingStepTitle
        title={tr("Catégories", "Categories")}
        subtitle={tr("Structurez votre carte : chaque catégorie devient une tuile sur votre vitrine.", "Structure your menu: each category becomes a tile on your storefront.")}
      />

      <ul className="space-y-2">
        {categories.map((cat, i) => (
          <li
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => setDragOver(null)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-all",
              dragOver === i && "ring-2 ring-[var(--primary)] opacity-80"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

            {editingId === cat.id ? (
              <>
                <Input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  className="w-12 text-center text-lg px-1 h-8 shrink-0"
                  maxLength={4}
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveEdit(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 h-8"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void saveEdit(cat.id)}
                  disabled={saving}
                  className="shrink-0 text-green-600 hover:text-green-700"
                  aria-label={tr("Valider", "Confirm")}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={tr("Annuler", "Cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xl shrink-0">{cat.icon_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  {cat.description ? (
                    <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void startEdit(cat)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={tr("Renommer", "Rename")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteCategory(cat.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={tr("Supprimer", "Delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          setFormPresentation(isMobile ? "drawer" : "sheet");
          setSubView("main");
          setCreateOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
      >
        <Plus className="h-4 w-4" />
        {tr("Nouvelle catégorie", "New category")}
      </button>

      {formPresentation === "drawer" ? (
        <Drawer
          open={createOpen}
          onOpenChange={(open) => {
            if (open) {
              setCreateOpen(true);
              return;
            }
            closeCreatePanel();
          }}
        >
          <DrawerContent className="flex max-h-[90vh] flex-col overflow-hidden">
            <DrawerHeader className={subView !== "main" ? "flex-row items-center gap-2" : undefined}>
              {subView !== "main" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <DrawerTitle>
                {subView === "icon"
                  ? tr("Icône de la catégorie", "Category icon")
                  : tr("Nouvelle catégorie", "New category")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
              {subView === "icon" ? iconPanel : createCategoryForm}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet
          open={createOpen}
          onOpenChange={(open) => {
            if (open) {
              setCreateOpen(true);
              return;
            }
            closeCreatePanel();
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-md h-full overflow-hidden">
            <SheetHeader className={subView !== "main" ? "flex-row items-center gap-2" : undefined}>
              {subView !== "main" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSubView("main")}
                  aria-label={tr("Retour", "Back")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : null}
              <SheetTitle>
                {subView === "icon"
                  ? tr("Icône de la catégorie", "Category icon")
                  : tr("Nouvelle catégorie", "New category")}
              </SheetTitle>
            </SheetHeader>
            <div className="h-full min-h-0 overflow-y-auto px-4 pb-4">
              {subView === "icon" ? iconPanel : createCategoryForm}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
