import type { ShopType, OrderStatus, FulfillmentMode } from "./types";

/** Lignes max pour la description boutique (aligné sur `line-clamp-6` vitrine). */
export const SHOP_DESCRIPTION_MAX_LINES = 6;

export const ALLERGENS: { value: string; label: string; emoji: string }[] = [
  { value: "gluten",      label: "Gluten",         emoji: "🌾" },
  { value: "crustaceans", label: "Crustacés",       emoji: "🦞" },
  { value: "eggs",        label: "Œufs",            emoji: "🥚" },
  { value: "fish",        label: "Poisson",         emoji: "🐟" },
  { value: "peanuts",     label: "Cacahuètes",      emoji: "🥜" },
  { value: "soybeans",    label: "Soja",            emoji: "🫘" },
  { value: "milk",        label: "Lait",            emoji: "🥛" },
  { value: "nuts",        label: "Fruits à coque",  emoji: "🌰" },
  { value: "celery",      label: "Céleri",          emoji: "🥬" },
  { value: "mustard",     label: "Moutarde",        emoji: "🌼" },
  { value: "sesame",      label: "Sésame",          emoji: "🌱" },
  { value: "sulphites",   label: "Sulfites",        emoji: "🍷" },
  { value: "lupin",       label: "Lupin",           emoji: "🌸" },
  { value: "molluscs",    label: "Mollusques",      emoji: "🦑" },
];

/** Couleurs de texte / bordure des badges labels (contraste ≥ 4,5:1 sur fond clair, RGAA 3.2). */
export const LABELS: { value: string; label: string; color: string }[] = [
  { value: "vegan", label: "Vegan", color: "#15803d" },
  { value: "vegetarian", label: "Végétarien", color: "#166534" },
  { value: "gluten_free", label: "Sans gluten", color: "#b45309" },
  { value: "organic", label: "Bio", color: "#047857" },
  { value: "spicy", label: "Épicé", color: "#b91c1c" },
  { value: "homemade", label: "Fait maison", color: "#6d28d9" },
  { value: "new", label: "Nouveau", color: "#1d4ed8" },
  { value: "bestseller", label: "Best-seller", color: "#c2410c" },
  { value: "halal", label: "Halal", color: "#0f766e" },
  { value: "kosher", label: "Casher", color: "#4338ca" },
];

export const SHOP_TYPES: { value: ShopType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bakery", label: "Boulangerie / Pâtisserie" },
  { value: "cafe", label: "Café / Bar" },
  { value: "foodtruck", label: "Food Truck" },
  { value: "catering", label: "Traiteur" },
  { value: "other", label: "Autre" },
];

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  color: string;
}[] = [
  { value: "pending", label: "En attente", color: "#f59e0b" },
  { value: "confirmed", label: "Confirmée", color: "#3b82f6" },
  { value: "preparing", label: "En préparation", color: "#8b5cf6" },
  { value: "ready", label: "Prête", color: "#22c55e" },
  { value: "delivered", label: "Livrée", color: "#10b981" },
  { value: "cancelled", label: "Annulée", color: "#ef4444" },
];

export const FULFILLMENT_MODES: {
  value: FulfillmentMode;
  label: string;
  icon: string;
}[] = [
  { value: "dine_in", label: "Sur place", icon: "UtensilsCrossed" },
  { value: "takeaway", label: "À emporter", icon: "ShoppingBag" },
  { value: "delivery", label: "Livraison", icon: "Truck" },
];
