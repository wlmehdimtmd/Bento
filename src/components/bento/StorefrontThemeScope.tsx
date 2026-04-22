"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useTheme } from "next-themes";

import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";
import { StorefrontChromeColorSync } from "@/components/bento/StorefrontChromeColorSync";
import { getStorefrontThemePreviewStyle, type StorefrontThemeOverrides } from "@/lib/storefrontTheme";
import { cn } from "@/lib/utils";

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
    <div className={cn("relative bg-background", className)} style={style}>
      <StorefrontChromeColorSync
        themeKey={themeKey}
        themeOverrides={themeOverrides}
        mounted={mounted}
        isDark={isDark}
      />
      <div className="relative z-[1]">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 z-0 h-[320px] w-[320px] rounded-full"
        style={{
          backgroundColor: "var(--storefront-orb-color)",
          filter: "blur(192px)",
        }}
      />
    </div>
  );
}
