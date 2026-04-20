"use client";

import { ALLERGENS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ProductLabelOption } from "@/lib/shop-labels";

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  labels: ProductLabelOption[];
  disabled?: boolean;
}

export function TagSelector({ selected, onChange, labels, disabled }: TagSelectorProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((t) => t !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Allergens */}
      <div className="space-y-1.5" role="group" aria-labelledby="tagselector-allergens-title">
        <p
          id="tagselector-allergens-title"
          className="text-xs font-medium text-muted-foreground"
        >
          Allergènes
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map((a) => {
            const active = selected.includes(a.value);
            return (
              <button
                key={a.value}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => toggle(a.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                    : "bg-transparent text-muted-foreground border-border hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-1.5" role="group" aria-labelledby="tagselector-labels-title">
        <p
          id="tagselector-labels-title"
          className="text-xs font-medium text-muted-foreground"
        >
          Labels
        </p>
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l) => {
            const active = selected.includes(l.value);
            return (
              <button
                key={l.value}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => toggle(l.value)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  disabled && "pointer-events-none opacity-50"
                )}
                style={
                  active
                    ? {
                        backgroundColor: `${l.color}20`,
                        color: l.color,
                        borderColor: `${l.color}60`,
                      }
                    : {
                        color: "var(--muted-foreground)",
                        borderColor: "var(--border)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!active && !disabled) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${l.color}10`;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${l.color}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active && !disabled) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  }
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
