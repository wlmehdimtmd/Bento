import { ALLERGENS, LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  value: string;
  size?: "sm" | "md";
}

// Resolve tag metadata from constants
function resolveTag(value: string) {
  const allergen = ALLERGENS.find((a) => a.value === value);
  if (allergen) return { label: allergen.label, emoji: allergen.emoji, type: "allergen" as const, color: null };

  const label = LABELS.find((l) => l.value === value);
  if (label) return { label: label.label, emoji: null, type: "label" as const, color: label.color };

  return { label: value, emoji: null, type: "unknown" as const, color: null };
}

export function TagBadge({ value, size = "md" }: TagBadgeProps) {
  const { label, emoji, type, color } = resolveTag(value);

  if (size === "sm") {
    const visible = type === "allergen" && emoji ? emoji : label.slice(0, 3);
    return (
      <span
        title={label}
        aria-label={label}
        className={cn(
          "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
          type === "allergen"
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : type === "label" && color
              ? "border bg-white shadow-sm"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        )}
        style={
          type === "label" && color
            ? {
                color,
                borderColor: `${color}66`,
              }
            : undefined
        }
      >
        <span aria-hidden="true">{visible}</span>
      </span>
    );
  }

  const mdAllergenWithEmoji = type === "allergen" && Boolean(emoji);

  return (
    <span
      aria-label={mdAllergenWithEmoji ? label : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        type === "allergen"
          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          : "border-transparent"
      )}
      style={
        type === "label" && color
          ? {
              backgroundColor: `${color}18`,
              color,
              borderColor: `${color}40`,
            }
          : undefined
      }
    >
      {mdAllergenWithEmoji ? (
        <span aria-hidden="true">
          {emoji} {label}
        </span>
      ) : (
        <>
          {type === "allergen" && emoji ? `${emoji} ` : ""}
          {label}
        </>
      )}
    </span>
  );
}
