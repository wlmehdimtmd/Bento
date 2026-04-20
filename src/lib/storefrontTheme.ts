import type { CSSProperties } from "react";

import {
  CATEGORY_THEME_KEYS,
  DEFAULT_CATEGORY_THEME_KEY,
  getCategoryThemeScale,
  type CategoryThemeKey,
} from "@/lib/categoryThemeTokens";

const STOREFRONT_THEME_KEY_SET = new Set<string>(CATEGORY_THEME_KEYS);

export function isStorefrontThemeKey(value: unknown): value is CategoryThemeKey {
  return typeof value === "string" && STOREFRONT_THEME_KEY_SET.has(value);
}

export function coerceStorefrontThemeKey(value: unknown): CategoryThemeKey {
  return isStorefrontThemeKey(value) ? value : DEFAULT_CATEGORY_THEME_KEY;
}

export function getStorefrontThemePreviewStyle(
  themeKey: CategoryThemeKey,
  isDark: boolean
): CSSProperties {
  const scale = getCategoryThemeScale(themeKey);
  const level = isDark ? scale.dark : scale.light;
  const buttonScale = isDark ? scale.buttons.dark : scale.buttons.light;

  return {
    "--background": level.background,
    "--secondary": level.surface,
    "--muted": level.surface,
    "--accent": level.surface,
    "--card": level.card,
    "--popover": level.card,
    "--foreground": level.text,
    "--card-foreground": level.text,
    "--popover-foreground": level.text,
    "--secondary-foreground": level.text,
    "--muted-foreground": isDark ? "rgba(255,255,255,0.75)" : "rgba(17,17,17,0.72)",
    "--accent-foreground": level.text,
    "--border": isDark ? "rgba(255,255,255,0.12)" : "#d4d4d8",
    "--input": isDark ? "rgba(255,255,255,0.16)" : "#d4d4d8",
    "--ring": buttonScale.primaryBg,
    "--color-bento-accent": buttonScale.primaryBg,
  } as CSSProperties;
}
