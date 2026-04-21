import type { AppLocale } from "@/lib/i18n";

/** Textes d’aide sous le titre des pages catalogue (dashboard). */
const DASHBOARD_CATALOG_COPY = {
  fr: {
    category:
      "Les sections de votre vitrine : l’ordre affiché ici est celui du menu public ; chaque catégorie regroupe des produits présentés ensemble.",
    product:
      "Plats ou articles avec prix et disponibles à l’achat sur la vitrine ; chaque produit appartient à une catégorie.",
    bundle:
      "Offres à prix fixe qui assemblent plusieurs choix (produits d’une catégorie ou créneaux dédiés) pour composer un menu-type.",
    label:
      "Badges personnalisés affichés sur les produits (ex. Nouveauté, Best-seller) pour mettre en avant votre carte.",
  },
  en: {
    category:
      "The sections of your storefront: the order shown here is the same as on the public menu; each category groups products displayed together.",
    product:
      "Dishes or items with prices available for purchase on your storefront; each product belongs to a category.",
    bundle:
      "Fixed-price offers combining multiple choices (products from a category or dedicated slots) to build a set menu.",
    label:
      "Custom badges shown on products (for example New, Best seller) to highlight your menu.",
  },
} as const;

export type DashboardCatalogCopyKey = keyof (typeof DASHBOARD_CATALOG_COPY)["fr"];

export function getDashboardCatalogCopy(locale: AppLocale, key: DashboardCatalogCopyKey): string {
  return DASHBOARD_CATALOG_COPY[locale][key];
}
