import type { CategoryThemeKey } from "@/lib/categoryThemeTokens";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) {
    return null;
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return {
    h: ((Math.round(h * 360) % 360) + 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Dégradé radial vitrine pour pastille d’aperçu : coin haut-gauche = même teinte,
 * saturation 100 %, luminosité ajustée (clair : L−10, sombre : L+10) ; coin opposé = couleur réelle.
 * Thème neutre : départ #CCCCCC (aperçu clair) ou #333333 (aperçu sombre) vers la couleur de fond du thème.
 */
export function buildStorefrontSwatchRadialBackground(
  backgroundHex: string,
  previewDarkMode: boolean,
  themeKey: CategoryThemeKey
): string | null {
  if (themeKey === "neutral") {
    const start = previewDarkMode ? "#333333" : "#CCCCCC";
    return `radial-gradient(farthest-corner at 0% 0%, ${start} 0%, ${backgroundHex} 100%)`;
  }
  const rgb = hexToRgb(backgroundHex);
  if (!rgb) {
    return null;
  }
  const { h, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const startL = previewDarkMode ? clamp(l + 10, 0, 100) : clamp(l - 10, 0, 100);
  const start = `hsl(${h} 100% ${startL}%)`;
  return `radial-gradient(farthest-corner at 0% 0%, ${start} 0%, ${backgroundHex} 100%)`;
}
