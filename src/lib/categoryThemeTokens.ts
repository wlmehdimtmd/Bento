/**
 * Palettes vitrine (fond / surface / carte) + boutons primaires (noir en clair, blanc en sombre).
 * Texte des niveaux : #111111 (clair) / #ffffff (sombre) pour tous les thèmes.
 */

/** Accent vitrine commun à tous les thèmes (clair = bleu plus vif, sombre = bleu plus soutenu). */
export const STOREFRONT_GLOBAL_ACCENT_HEX = {
  light: "#6fa0ff",
  dark: "#376cd5",
} as const;

/** Carte mode clair : blanc à 70 % d’opacité (tous les thèmes). */
export const CATEGORY_THEME_CARD_SEMI = "#ffffffb3";

/** Carte mode sombre : #FBFBFB à 10 % d’opacité (tous les thèmes). */
export const CATEGORY_THEME_CARD_DARK_SEMI = "#fbfbfb1a";

const TEXT_LIGHT = "#111111";
const TEXT_DARK = "#ffffff";

/** Bouton primaire : fond noir en mode clair, fond blanc en mode sombre. */
const PRIMARY_LIGHT_BG = "#111111";
const PRIMARY_LIGHT_TEXT = "#ffffff";
const PRIMARY_DARK_BG = "#ffffff";
const PRIMARY_DARK_TEXT = "#111111";

export const CATEGORY_THEME_KEYS = [
  "neutral",
  "blue",
  "turquoise",
  "emerald",
  "rose",
  "amber",
] as const;

export type CategoryThemeKey = (typeof CATEGORY_THEME_KEYS)[number];

/** Anciennes clés `storefront_theme_key` / JSON overrides → clés actuelles. */
export const CATEGORY_THEME_LEGACY_KEY_MAP: Record<string, CategoryThemeKey> = {
  brandMono: "neutral",
  violet: "turquoise",
  indigo: "turquoise",
  teal: "emerald",
  slate: "neutral",
};

export type CategoryThemeLevels = {
  background: string;
  surface: string;
  card: string;
  text: string;
};

export type CategoryThemeScale = {
  label: string;
  light: CategoryThemeLevels;
  dark: CategoryThemeLevels;
  buttons: {
    light: {
      primaryBg: string;
      primaryText: string;
      secondaryBg: string;
      secondaryText: string;
      secondaryBorder: string;
    };
    dark: {
      primaryBg: string;
      primaryText: string;
      secondaryBg: string;
      secondaryText: string;
      secondaryBorder: string;
    };
  };
};

export const DEFAULT_CATEGORY_THEME_KEY: CategoryThemeKey = "turquoise";

const sharedButtons = {
  light: {
    primaryBg: PRIMARY_LIGHT_BG,
    primaryText: PRIMARY_LIGHT_TEXT,
    secondaryBg: "#f4f4f5",
    secondaryText: TEXT_LIGHT,
    secondaryBorder: "#d4d4d8",
  },
  dark: {
    primaryBg: PRIMARY_DARK_BG,
    primaryText: PRIMARY_DARK_TEXT,
    secondaryBg: "#1a1a1a",
    secondaryText: TEXT_DARK,
    secondaryBorder: "#3f3f46",
  },
} as const;

export const CATEGORY_THEME_TOKENS: Record<CategoryThemeKey, CategoryThemeScale> = {
  neutral: {
    label: "Neutre",
    light: {
      background: "#f7f7f7",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#000000",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
  blue: {
    label: "Bleu",
    light: {
      background: "#F2F6FD",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#000d19",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
  turquoise: {
    label: "Turquoise",
    light: {
      background: "#F2FBFD",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#001114",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
  emerald: {
    label: "Emerald",
    light: {
      background: "#F2FDFB",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#04100e",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
  rose: {
    label: "Rose",
    light: {
      background: "#FAF2FD",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#110915",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
  amber: {
    label: "Ambre",
    light: {
      background: "#FDF6F2",
      surface: "#ffffffb3",
      card: CATEGORY_THEME_CARD_SEMI,
      text: TEXT_LIGHT,
    },
    dark: {
      background: "#140700",
      surface: "#fbfbfb1a",
      card: CATEGORY_THEME_CARD_DARK_SEMI,
      text: TEXT_DARK,
    },
    buttons: { ...sharedButtons },
  },
};

export function getCategoryThemeScale(key: CategoryThemeKey): CategoryThemeScale {
  return CATEGORY_THEME_TOKENS[key] ?? CATEGORY_THEME_TOKENS[DEFAULT_CATEGORY_THEME_KEY];
}
