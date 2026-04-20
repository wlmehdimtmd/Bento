export const CATEGORY_THEME_KEYS = [
  "brandMono",
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

export const DEFAULT_CATEGORY_THEME_KEY: CategoryThemeKey = "indigo";

export const CATEGORY_THEME_TOKENS: Record<CategoryThemeKey, CategoryThemeScale> = {
  brandMono: {
    label: "Marque (Noir & Blanc)",
    light: {
      background: "#f0f0f0",
      surface: "#f7f7f7",
      card: "#ffffff",
      text: "#111111",
    },
    dark: {
      background: "#0f0f0f",
      surface: "#181818",
      card: "#232323",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  indigo: {
    label: "Indigo",
    light: {
      background: "#edf0ff",
      surface: "#f4f6ff",
      card: "#fbfcff",
      text: "#111111",
    },
    dark: {
      background: "#111433",
      surface: "#181c45",
      card: "#20255a",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  violet: {
    label: "Violet",
    light: {
      background: "#f2ecff",
      surface: "#f7f3ff",
      card: "#fcfaff",
      text: "#111111",
    },
    dark: {
      background: "#261236",
      surface: "#301747",
      card: "#3c1d59",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  blue: {
    label: "Blue",
    light: {
      background: "#eaf1ff",
      surface: "#f2f7ff",
      card: "#fafdff",
      text: "#111111",
    },
    dark: {
      background: "#10233c",
      surface: "#14304f",
      card: "#1a3f66",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  teal: {
    label: "Teal",
    light: {
      background: "#e5f8f5",
      surface: "#eefbf8",
      card: "#f8fefd",
      text: "#111111",
    },
    dark: {
      background: "#0d2f2b",
      surface: "#11403a",
      card: "#165247",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  emerald: {
    label: "Emerald",
    light: {
      background: "#e7f7ec",
      surface: "#effbf3",
      card: "#f9fefa",
      text: "#111111",
    },
    dark: {
      background: "#112e1e",
      surface: "#164027",
      card: "#1b5533",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  amber: {
    label: "Amber",
    light: {
      background: "#faf2df",
      surface: "#fcf7eb",
      card: "#fffdf8",
      text: "#111111",
    },
    dark: {
      background: "#39240f",
      surface: "#4b3013",
      card: "#603d18",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  rose: {
    label: "Rose",
    light: {
      background: "#fbecef",
      surface: "#fdf3f5",
      card: "#fffafb",
      text: "#111111",
    },
    dark: {
      background: "#3a1422",
      surface: "#4c1a2c",
      card: "#622137",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
  slate: {
    label: "Slate",
    light: {
      background: "#edf0f4",
      surface: "#f4f6f9",
      card: "#fbfcfe",
      text: "#111111",
    },
    dark: {
      background: "#161a24",
      surface: "#1e2430",
      card: "#283041",
      text: "#ffffff",
    },
    buttons: {
      light: {
        primaryBg: "#111111",
        primaryText: "#ffffff",
        secondaryBg: "#f4f4f5",
        secondaryText: "#111111",
        secondaryBorder: "#d4d4d8",
      },
      dark: {
        primaryBg: "#ffffff",
        primaryText: "#111111",
        secondaryBg: "#181818",
        secondaryText: "#ffffff",
        secondaryBorder: "#3f3f46",
      },
    },
  },
};

export function getCategoryThemeScale(key: CategoryThemeKey): CategoryThemeScale {
  return CATEGORY_THEME_TOKENS[key] ?? CATEGORY_THEME_TOKENS[DEFAULT_CATEGORY_THEME_KEY];
}
