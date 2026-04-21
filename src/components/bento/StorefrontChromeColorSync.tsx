"use client";

import { useLayoutEffect } from "react";

import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { getStorefrontCanvasBackgroundHex, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";

const THEME_COLOR_META_ID = "storefront-theme-color";

function upsertThemeColorMeta(content: string) {
  let el = document.getElementById(THEME_COLOR_META_ID) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.id = THEME_COLOR_META_ID;
    el.setAttribute("name", "theme-color");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export interface StorefrontChromeColorSyncProps {
  themeKey: CategoryThemeKey;
  themeOverrides?: StorefrontThemeOverrides;
  /** Aligné sur `StorefrontThemeScope` : faux tant que non hydraté. */
  mounted: boolean;
  isDark: boolean;
}

export function StorefrontChromeColorSync({
  themeKey,
  themeOverrides,
  mounted,
  isDark,
}: StorefrontChromeColorSyncProps) {
  useLayoutEffect(() => {
    if (!mounted) return;

    const hex = getStorefrontCanvasBackgroundHex(themeKey, isDark, themeOverrides);
    document.documentElement.style.backgroundColor = hex;
    document.body.style.backgroundColor = hex;
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    upsertThemeColorMeta(hex);

    return () => {
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
      document.documentElement.style.removeProperty("color-scheme");
      document.getElementById(THEME_COLOR_META_ID)?.remove();
    };
  }, [mounted, themeKey, isDark, themeOverrides]);

  return null;
}
