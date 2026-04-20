"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { ExtractedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MENU_IMPORT_TAG_OPTIONS, normalizeTagsForDb } from "@/lib/menu-import-tag-map";
import { motion, AnimatePresence } from "framer-motion";

export type LocalExtractedProduct = ExtractedProduct & { _id: string };

interface ExtractedProductCardProps {
  product: LocalExtractedProduct;
  selected: boolean;
  onToggle: () => void;
  onEdit: (updated: LocalExtractedProduct) => void;
}

function confidenceBorder(c: ExtractedProduct["confidence"]) {
  if (c === "high") return "border-l-4 border-l-emerald-500";
  if (c === "medium") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-red-500";
}

export function ExtractedProductCard({
  product,
  selected,
  onToggle,
  onEdit,
}: ExtractedProductCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(product);

  function saveDraft() {
    onEdit({ ...draft, _id: product._id });
    setEditing(false);
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-lg border bg-card p-3 text-sm shadow-sm",
        confidenceBorder(product.confidence),
        !selected && "opacity-60"
      )}
    >
      <div className="flex gap-3">
        <div className="pt-0.5">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle()}
            aria-label="Inclure ce produit"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Nom"
                    />
                    <Input
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={draft.price}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            price: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-28"
                      />
                      <Input
                        value={draft.category_suggestion}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, category_suggestion: e.target.value }))
                        }
                        placeholder="Catégorie"
                        className="min-w-0 flex-1"
                      />
                    </div>
                    <Input
                      value={draft.option_label ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          option_label: e.target.value || null,
                        }))
                      }
                      placeholder="Option (ex. Cuisson ?)"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {MENU_IMPORT_TAG_OPTIONS.map((t) => {
                        const on = draft.tags.includes(t.value);
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                tags: on
                                  ? d.tags.filter((x) => x !== t.value)
                                  : [...d.tags, t.value],
                              }))
                            }
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs",
                              on
                                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={saveDraft}>
                        OK
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDraft(product);
                          setEditing(false);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="font-medium text-foreground">{product.name}</p>
                    {product.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {product.price.toFixed(2)}&nbsp;€
                    </p>
                    {product.tags.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.tags.join(" · ")}
                      </p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!editing && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                onClick={() => {
                  setDraft({
                    ...product,
                    tags: normalizeTagsForDb(product.tags),
                  });
                  setEditing(true);
                }}
                aria-label="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-medium",
                product.confidence === "high" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                product.confidence === "medium" && "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                product.confidence === "low" && "bg-red-500/15 text-red-700 dark:text-red-400"
              )}
            >
              {product.confidence === "high" ? "🟢" : product.confidence === "medium" ? "🟡" : "🔴"}{" "}
              {product.confidence}
            </span>
            {product.confidence === "low" && (
              <span className="text-red-600 dark:text-red-400">Vérifiez ce produit</span>
            )}
            {product.price === 0 && product.confidence === "low" && (
              <span className="text-muted-foreground">Prix non détecté</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
