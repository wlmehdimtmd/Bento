import type { CSSProperties } from "react";

import {
  CATEGORY_THEME_KEYS,
  CATEGORY_THEME_LEGACY_KEY_MAP,
  CATEGORY_THEME_TOKENS,
  DEFAULT_CATEGORY_THEME_KEY,
  getCategoryThemeScale,
  STOREFRONT_GLOBAL_ACCENT_HEX,
  type CategoryThemeLevels,
  type CategoryThemeKey,
} from "@/lib/categoryThemeTokens";

const STOREFRONT_THEME_KEY_SET = new Set<string>(CATEGORY_THEME_KEYS);
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/** Couleur du halo vitrine (mode clair / mode sombre). */
const STOREFRONT_ORB_COLORS: Record<CategoryThemeKey, { light: string; dark: string }> = {
  neutral: { light: "#c9e1f9", dark: "#6fa0ff" },
  blue: { light: "#cae1f8", dark: "#00315e" },
  turquoise: { light: "#accfd6", dark: "#004c5a" },
  emerald: { light: "#abd5ce", dark: "#124941" },
  rose: { light: "#ceb0d8", dark: "#381e45" },
  amber: { light: "#dfc4b5", dark: "#51250f" },
};

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex: string): Rgb {
  const src = hex.startsWith("#") ? hex.slice(1) : hex;
  const normalized = src.length === 3 ? src.split("").map((c) => `${c}${c}`).join("") : src;
  if (normalized.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  return { h: h * 60, s: clampUnit(s), l: clampUnit(l) };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function adjustOrbColorForMode(themeKey: CategoryThemeKey, color: string, isDark: boolean): string {
  if (!isDark) {
    if (themeKey === "neutral") return "#ffffff";
    const hsl = rgbToHsl(hexToRgb(color));
    return rgbToHex(hslToRgb({ ...hsl, s: 1, l: clampUnit(hsl.l - 0.1) }));
  }
  if (themeKey === "neutral") return "#cccccc";

  const hsl = rgbToHsl(hexToRgb(color));
  return rgbToHex(hslToRgb({ ...hsl, l: clampUnit(hsl.l + 0.1) }));
}

function getStorefrontOrbColor(themeKey: CategoryThemeKey, isDark: boolean): string {
  const base = STOREFRONT_ORB_COLORS[themeKey][isDark ? "dark" : "light"];
  return adjustOrbColorForMode(themeKey, base, isDark);
}

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
  const globalAccent = isDark ? STOREFRONT_GLOBAL_ACCENT_HEX.dark : STOREFRONT_GLOBAL_ACCENT_HEX.light;
  const globalAccentFg = isDark ? "#ffffff" : "#111111";
  const secondaryBg = isDark ? "#181818" : "#f7f7f7";
  const secondaryFg = isDark ? "oklch(0.985 0 0)" : "oklch(0.205 0 0)";

  return {
    "--background": level.background,
    "--secondary": secondaryBg,
    "--muted": level.surface,
    "--accent": level.surface,
    "--card": level.card,
    "--popover": level.card,
    "--foreground": level.text,
    "--card-foreground": level.text,
    "--popover-foreground": level.text,
    "--secondary-foreground": secondaryFg,
    "--button-secondary": secondaryBg,
    "--button-secondary-foreground": secondaryFg,
    "--muted-foreground": isDark ? "rgba(255,255,255,0.75)" : "rgba(17,17,17,0.72)",
    "--accent-foreground": level.text,
    "--border": isDark ? "rgba(255,255,255,0.12)" : "#d4d4d8",
    "--input": isDark ? "rgba(255,255,255,0.16)" : "#d4d4d8",
    "--ring": globalAccent,
    "--primary": buttonScale.primaryBg,
    "--primary-foreground": buttonScale.primaryText,
    "--color-bento-accent": globalAccent,
    "--color-bento-accent-foreground": globalAccentFg,
    "--color-bento-card-bg": lightestLevelColor,
    "--storefront-orb-color": getStorefrontOrbColor(themeKey, isDark),
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

/** Fond page vitrine (même valeur que `--background` dans `getStorefrontThemePreviewStyle`). */
export function getStorefrontCanvasBackgroundHex(
  themeKey: CategoryThemeKey,
  isDark: boolean,
  overrides?: StorefrontThemeOverrides | null
): string {
  const scale = getStorefrontThemeScaleWithOverrides(themeKey, overrides);
  return isDark ? scale.dark.background : scale.light.background;
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
