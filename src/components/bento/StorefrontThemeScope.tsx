"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useTheme } from "next-themes";

import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { getStorefrontThemePreviewStyle, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";

interface StorefrontThemeScopeProps {
  themeKey: CategoryThemeKey;
  themeOverrides?: StorefrontThemeOverrides;
  className?: string;
  children: ReactNode;
}

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function StorefrontThemeScope({
  themeKey,
  themeOverrides,
  className = "",
  children,
}: StorefrontThemeScopeProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const isDark = mounted ? resolvedTheme === "dark" : false;

  const style = useMemo(
    () => getStorefrontThemePreviewStyle(themeKey, isDark, themeOverrides),
    [themeKey, isDark, themeOverrides]
  );

  return (
    <div className={`bg-background ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
