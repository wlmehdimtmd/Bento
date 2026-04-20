import type { CSSProperties } from "react";

import {
  CATEGORY_THEME_KEYS,
  CATEGORY_THEME_LEGACY_KEY_MAP,
  CATEGORY_THEME_TOKENS,
  DEFAULT_CATEGORY_THEME_KEY,
  getCategoryThemeScale,
  type CategoryThemeLevels,
  type CategoryThemeKey,
} from "@/lib/categoryThemeTokens";

const STOREFRONT_THEME_KEY_SET = new Set<string>(CATEGORY_THEME_KEYS);
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/** Couleur du halo vitrine (mode clair / mode sombre). */
const STOREFRONT_ORB_COLORS: Record<CategoryThemeKey, { light: string; dark: string }> = {
  neutral: { light: "#c9e1f9", dark: "#6fa0ff" },
  blue: { light: "#cae1f8", dark: "#00315e" },
  indigo: { light: "#accfd6", dark: "#004c5a" },
  emerald: { light: "#abd5ce", dark: "#124941" },
  rose: { light: "#ceb0d8", dark: "#381e45" },
  amber: { light: "#dfc4b5", dark: "#51250f" },
};

type StorefrontThemeButtons = {
  primaryBg: string;
  primaryText: string;
};

export type StorefrontThemeEditableScale = {
  light: CategoryThemeLevels;
  dark: CategoryThemeLevels;
  buttons: {
    light: StorefrontThemeButtons;
    dark: StorefrontThemeButtons;
  };
};

export type StorefrontThemeEditableScalePartial = {
  light?: Partial<CategoryThemeLevels>;
  dark?: Partial<CategoryThemeLevels>;
  buttons?: {
    light?: Partial<StorefrontThemeButtons>;
    dark?: Partial<StorefrontThemeButtons>;
  };
};

export type StorefrontThemeOverrides = Partial<
  Record<CategoryThemeKey, StorefrontThemeEditableScalePartial>
>;

export function isStorefrontThemeKey(value: unknown): value is CategoryThemeKey {
  return typeof value === "string" && STOREFRONT_THEME_KEY_SET.has(value);
}

export function coerceStorefrontThemeKey(value: unknown): CategoryThemeKey {
  if (typeof value !== "string") return DEFAULT_CATEGORY_THEME_KEY;
  const k = value.trim();
  if (k.length === 0) return DEFAULT_CATEGORY_THEME_KEY;
  if (STOREFRONT_THEME_KEY_SET.has(k)) return k as CategoryThemeKey;
  const mapped = CATEGORY_THEME_LEGACY_KEY_MAP[k];
  if (mapped) return mapped;
  return DEFAULT_CATEGORY_THEME_KEY;
}

export function getStorefrontThemePreviewStyle(
  themeKey: CategoryThemeKey,
  isDark: boolean,
  overrides?: StorefrontThemeOverrides | null
): CSSProperties {
  const scale = getStorefrontThemeScaleWithOverrides(themeKey, overrides);
  const level = isDark ? scale.dark : scale.light;
  const buttonScale = isDark ? scale.buttons.dark : scale.buttons.light;
  const lightestLevelColor = pickLightestHexColor(level.background, level.surface, level.card);

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
    "--primary": buttonScale.primaryBg,
    "--primary-foreground": buttonScale.primaryText,
    "--color-bento-accent": buttonScale.primaryBg,
    "--color-bento-accent-foreground": buttonScale.primaryText,
    "--color-bento-card-bg": lightestLevelColor,
    "--storefront-orb-color": STOREFRONT_ORB_COLORS[themeKey][isDark ? "dark" : "light"],
  } as CSSProperties;
}

export function getStorefrontThemeScaleWithOverrides(
  themeKey: CategoryThemeKey,
  overrides?: StorefrontThemeOverrides | null
): StorefrontThemeEditableScale {
  const scale = getCategoryThemeScale(themeKey);
  const override = overrides?.[themeKey];
  return {
    light: {
      background: sanitizeHexColor(override?.light?.background, scale.light.background),
      surface: sanitizeHexColor(override?.light?.surface, scale.light.surface),
      card: sanitizeHexColor(override?.light?.card, scale.light.card),
      text: sanitizeHexColor(override?.light?.text, scale.light.text),
    },
    dark: {
      background: sanitizeHexColor(override?.dark?.background, scale.dark.background),
      surface: sanitizeHexColor(override?.dark?.surface, scale.dark.surface),
      card: sanitizeHexColor(override?.dark?.card, scale.dark.card),
      text: sanitizeHexColor(override?.dark?.text, scale.dark.text),
    },
    buttons: {
      light: {
        primaryBg: sanitizeHexColor(override?.buttons?.light?.primaryBg, scale.buttons.light.primaryBg),
        primaryText: sanitizeHexColor(
          override?.buttons?.light?.primaryText,
          scale.buttons.light.primaryText
        ),
      },
      dark: {
        primaryBg: sanitizeHexColor(override?.buttons?.dark?.primaryBg, scale.buttons.dark.primaryBg),
        primaryText: sanitizeHexColor(
          override?.buttons?.dark?.primaryText,
          scale.buttons.dark.primaryText
        ),
      },
    },
  };
}

function parseThemeOverrideBlock(rawTheme: unknown): StorefrontThemeEditableScalePartial | null {
  if (!rawTheme || typeof rawTheme !== "object" || Array.isArray(rawTheme)) return null;
  const raw = rawTheme as Record<string, unknown>;
  const light = readLevel(raw.light);
  const dark = readLevel(raw.dark);
  const lightButtons = readButtons((raw.buttons as Record<string, unknown> | undefined)?.light);
  const darkButtons = readButtons((raw.buttons as Record<string, unknown> | undefined)?.dark);

  const themeOverride: StorefrontThemeEditableScalePartial = {};
  if (Object.keys(light).length > 0) themeOverride.light = light;
  if (Object.keys(dark).length > 0) themeOverride.dark = dark;
  if (lightButtons || darkButtons) {
    themeOverride.buttons = {};
    if (lightButtons) themeOverride.buttons.light = lightButtons;
    if (darkButtons) themeOverride.buttons.dark = darkButtons;
  }

  return Object.keys(themeOverride).length > 0 ? themeOverride : null;
}

export function coerceStorefrontThemeOverrides(value: unknown): StorefrontThemeOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const src = value as Record<string, unknown>;
  const result: StorefrontThemeOverrides = {};
  const consumed = new Set<CategoryThemeKey>();

  for (const themeKey of CATEGORY_THEME_KEYS) {
    const parsed = parseThemeOverrideBlock(src[themeKey]);
    if (!parsed) continue;
    result[themeKey] = parsed;
    consumed.add(themeKey);
  }

  for (const rawKey of Object.keys(src)) {
    if (STOREFRONT_THEME_KEY_SET.has(rawKey)) continue;
    const themeKey = CATEGORY_THEME_LEGACY_KEY_MAP[rawKey];
    if (!themeKey || consumed.has(themeKey)) continue;
    const parsed = parseThemeOverrideBlock(src[rawKey]);
    if (!parsed) continue;
    result[themeKey] = parsed;
    consumed.add(themeKey);
  }

  return result;
}

export function buildStorefrontThemeDefaults(): Record<CategoryThemeKey, StorefrontThemeEditableScale> {
  const out = {} as Record<CategoryThemeKey, StorefrontThemeEditableScale>;
  for (const key of CATEGORY_THEME_KEYS) {
    const token = CATEGORY_THEME_TOKENS[key];
    out[key] = {
      light: { ...token.light },
      dark: { ...token.dark },
      buttons: {
        light: {
          primaryBg: token.buttons.light.primaryBg,
          primaryText: token.buttons.light.primaryText,
        },
        dark: {
          primaryBg: token.buttons.dark.primaryBg,
          primaryText: token.buttons.dark.primaryText,
        },
      },
    };
  }
  return out;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return HEX_COLOR_PATTERN.test(value) ? value.toLowerCase() : fallback;
}

function readLevel(value: unknown): Partial<CategoryThemeLevels> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    ...(typeof row.background === "string" && HEX_COLOR_PATTERN.test(row.background)
      ? { background: row.background.toLowerCase() }
      : {}),
    ...(typeof row.surface === "string" && HEX_COLOR_PATTERN.test(row.surface)
      ? { surface: row.surface.toLowerCase() }
      : {}),
    ...(typeof row.card === "string" && HEX_COLOR_PATTERN.test(row.card)
      ? { card: row.card.toLowerCase() }
      : {}),
    ...(typeof row.text === "string" && HEX_COLOR_PATTERN.test(row.text)
      ? { text: row.text.toLowerCase() }
      : {}),
  };
}

function readButtons(value: unknown): Partial<StorefrontThemeButtons> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const parsed: Partial<StorefrontThemeButtons> = {
    ...(typeof row.primaryBg === "string" && HEX_COLOR_PATTERN.test(row.primaryBg)
      ? { primaryBg: row.primaryBg.toLowerCase() }
      : {}),
    ...(typeof row.primaryText === "string" && HEX_COLOR_PATTERN.test(row.primaryText)
      ? { primaryText: row.primaryText.toLowerCase() }
      : {}),
  };
  return Object.keys(parsed).length > 0 ? parsed : null;
}

function pickLightestHexColor(...hexColors: string[]): string {
  if (hexColors.length === 0) return "#ffffff";
  return (
    [...hexColors].sort((a, b) => relativeLuminance(stripHexAlpha(b)) - relativeLuminance(stripHexAlpha(a)))[0] ??
    "#ffffff"
  );
}

function relativeLuminance(hexColor: string): number {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const linearize = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function stripHexAlpha(hexColor: string): string {
  const normalized = hexColor.toLowerCase();
  if (/^#[0-9a-f]{8}$/.test(normalized)) return normalized.slice(0, 7);
  return normalized;
}
