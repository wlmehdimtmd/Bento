export const CATEGORY_THEME_KEYS = [
  "indigo",
  "violet",
  "blue",
  "teal",
  "emerald",
  "amber",
  "rose",
  "slate",
] as const;

export type CategoryThemeKey = (typeof CATEGORY_THEME_KEYS)[number];

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
};

export const DEFAULT_CATEGORY_THEME_KEY: CategoryThemeKey = "indigo";

export const CATEGORY_THEME_TOKENS: Record<CategoryThemeKey, CategoryThemeScale> = {
  indigo: {
    label: "Indigo",
    light: {
      background: "#e0e7ff",
      surface: "#c7d2fe",
      card: "#a5b4fc",
      text: "#111111",
    },
    dark: {
      background: "#312e81",
      surface: "#3730a3",
      card: "#4338ca",
      text: "#ffffff",
    },
  },
  violet: {
    label: "Violet",
    light: {
      background: "#f3e8ff",
      surface: "#e9d5ff",
      card: "#d8b4fe",
      text: "#111111",
    },
    dark: {
      background: "#581c87",
      surface: "#6b21a8",
      card: "#7e22ce",
      text: "#ffffff",
    },
  },
  blue: {
    label: "Blue",
    light: {
      background: "#dbeafe",
      surface: "#bfdbfe",
      card: "#93c5fd",
      text: "#111111",
    },
    dark: {
      background: "#1e3a8a",
      surface: "#1d4ed8",
      card: "#2563eb",
      text: "#ffffff",
    },
  },
  teal: {
    label: "Teal",
    light: {
      background: "#ccfbf1",
      surface: "#99f6e4",
      card: "#5eead4",
      text: "#111111",
    },
    dark: {
      background: "#134e4a",
      surface: "#115e59",
      card: "#0f766e",
      text: "#ffffff",
    },
  },
  emerald: {
    label: "Emerald",
    light: {
      background: "#dcfce7",
      surface: "#bbf7d0",
      card: "#86efac",
      text: "#111111",
    },
    dark: {
      background: "#14532d",
      surface: "#166534",
      card: "#15803d",
      text: "#ffffff",
    },
  },
  amber: {
    label: "Amber",
    light: {
      background: "#fef3c7",
      surface: "#fde68a",
      card: "#fcd34d",
      text: "#111111",
    },
    dark: {
      background: "#78350f",
      surface: "#92400e",
      card: "#b45309",
      text: "#ffffff",
    },
  },
  rose: {
    label: "Rose",
    light: {
      background: "#ffe4e6",
      surface: "#fecdd3",
      card: "#fda4af",
      text: "#111111",
    },
    dark: {
      background: "#881337",
      surface: "#9f1239",
      card: "#be123c",
      text: "#ffffff",
    },
  },
  slate: {
    label: "Slate",
    light: {
      background: "#e2e8f0",
      surface: "#cbd5e1",
      card: "#94a3b8",
      text: "#111111",
    },
    dark: {
      background: "#1e293b",
      surface: "#334155",
      card: "#475569",
      text: "#ffffff",
    },
  },
};

export function getCategoryThemeScale(key: CategoryThemeKey): CategoryThemeScale {
  return CATEGORY_THEME_TOKENS[key] ?? CATEGORY_THEME_TOKENS[DEFAULT_CATEGORY_THEME_KEY];
}
