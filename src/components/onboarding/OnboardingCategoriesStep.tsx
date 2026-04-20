"use client";

import { useState, useRef, useEffect } from "react";
import { GripVertical, Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { OnboardingStepTitle } from "@/components/onboarding/OnboardingStepTitle";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  icon_emoji: string;
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
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📦");
  const [showNewInput, setShowNewInput] = useState(false);
  const [saving, setSaving] = useState(false);

  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

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
          c.id === id ? { ...c, name: editName.trim(), icon_emoji: editEmoji || "📦" } : c
        )
      );
      setEditingId(null);
      notify();
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim(), icon_emoji: editEmoji || "📦" })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, name: editName.trim(), icon_emoji: editEmoji || "📦" } : c
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
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    notify();
  }

  async function addCategory() {
    if (!newName.trim()) return;
    if (isPreview) {
      const order = categories.length;
      setCategories((prev) => [
        ...prev,
        {
          id: previewId(),
          name: newName.trim(),
          icon_emoji: newEmoji || "📦",
          display_order: order,
        },
      ]);
      setNewName("");
      setNewEmoji("📦");
      setShowNewInput(false);
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
        icon_emoji: newEmoji || "📦",
        display_order: order,
        is_active: true,
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
    setNewEmoji("📦");
    setShowNewInput(false);
    notify();
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

  return (
    <div className="space-y-6 pt-2">
      <OnboardingStepTitle
        title="Catégories"
        subtitle="Structurez votre carte : chaque catégorie devient une tuile sur votre vitrine."
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
              dragOver === i && "ring-2 ring-[var(--color-bento-accent)] opacity-80"
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
                  aria-label="Valider"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Annuler"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-xl shrink-0">{cat.icon_emoji}</span>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => void startEdit(cat)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Renommer"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteCategory(cat.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {showNewInput ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-bento-accent)] bg-card px-3 py-2.5">
          <Input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="w-12 text-center text-lg px-1 h-8 shrink-0"
            maxLength={4}
            placeholder="📦"
          />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addCategory();
              if (e.key === "Escape") {
                setShowNewInput(false);
                setNewName("");
              }
            }}
            placeholder="Nom de la catégorie"
            className="flex-1 h-8"
            autoFocus
          />
          <button
            type="button"
            onClick={() => void addCategory()}
            disabled={saving || !newName.trim()}
            className="shrink-0 text-green-600 hover:text-green-700 disabled:opacity-40"
            aria-label="Ajouter"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewInput(false);
              setNewName("");
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Annuler"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNewInput(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-[var(--color-bento-accent)] hover:text-[var(--color-bento-accent)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      )}
    </div>
  );
}
