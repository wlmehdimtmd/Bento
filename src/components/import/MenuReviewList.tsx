"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ExtractedProductCard, type LocalExtractedProduct } from "./ExtractedProductCard";

interface MenuReviewListProps {
  products: LocalExtractedProduct[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (updated: LocalExtractedProduct) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function MenuReviewList({
  products,
  selectedIds,
  onToggle,
  onEdit,
  onSelectAll,
  onSelectNone,
}: MenuReviewListProps) {
  const groups = useMemo(() => {
    const m = new Map<string, LocalExtractedProduct[]>();
    for (const p of products) {
      const key = p.category_suggestion.trim() || "Autres";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [products]);

  return (
    <div className="flex max-h-[min(60vh,520px)] flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
          Tout sélectionner
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSelectNone}>
          Tout désélectionner
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {groups.map(([cat, items]) => (
          <section key={cat}>
            <h3 className="mb-2 font-heading text-sm font-semibold text-muted-foreground">
              {cat}
              <span className="ml-1 font-normal">({items.length})</span>
            </h3>
            <div className="space-y-2">
              {items.map((p) => (
                <ExtractedProductCard
                  key={p._id}
                  product={p}
                  selected={selectedIds.has(p._id)}
                  onToggle={() => onToggle(p._id)}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Sélection : {selectedIds.size}/{products.length} produit{products.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
