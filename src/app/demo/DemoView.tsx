"use client";

import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerContext";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PublicShopProvider } from "@/components/shop/PublicShopContext";
import { StoreView } from "@/components/bento/StoreView";
import type { PublicProduct } from "@/components/product/ProductDetail";
import type { CategoryInfo, BundleInfo, ShopInfo } from "@/components/bento/StoreView";
import type { StorefrontPhoto } from "@/lib/types";
import { DemoUnifiedTopBar } from "@/components/demo/DemoUnifiedTopBar";
import { StorefrontThemeScope } from "@/components/bento/StorefrontThemeScope";
import { DEFAULT_CATEGORY_THEME_KEY } from "@/lib/categoryThemeTokens";

// ── Static demo data ────────────────────────────────────────────

const DEMO_OPENING_HOURS = {
  weekly: {
    "0": { closed: true, slots: [] as { open: string; close: string }[] },
    "1": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
    "2": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
    "3": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
    "4": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
    "5": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
    "6": { closed: false, slots: [{ open: "12:00", close: "14:30" }, { open: "19:00", close: "22:30" }] },
  },
};

const DEMO_SHOP: ShopInfo = {
  id: "demo",
  name: "Maison Kanpai",
  slug: "demo",
  description: "Cuisine franco-japonaise raffinée.\nProduits frais, savoir-faire artisanal.\n📍 75001 Paris · Lun–Sam 12h–22h30",
  logo_url: null,
  cover_image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  address: "12 rue du Temple, 75001 Paris",
  phone: "+33 1 23 45 67 89",
  email_contact: "contact@maison-kanpai.demo",
  social_links: {},
  fulfillment_modes: ["dine_in", "takeaway"],
  opening_hours: DEMO_OPENING_HOURS,
  opening_timezone: "Europe/Paris",
  open_on_public_holidays: false,
};

const DEMO_CATEGORIES: CategoryInfo[] = [
  { id: "entrees", name: "Entrées", icon_emoji: "🥢", description: "Nos entrées fraîches du jour", productCount: 4 },
  { id: "plats", name: "Plats", icon_emoji: "🍜", description: "Plats signatures de la maison", productCount: 5 },
  { id: "sushis", name: "Sushis & Makis", icon_emoji: "🍣", description: "Poisson ultra-frais, livré chaque matin", productCount: 4 },
  { id: "desserts", name: "Desserts", icon_emoji: "🍰", description: "Douceurs nippones maison", productCount: 3 },
  { id: "boissons", name: "Boissons", icon_emoji: "🍶", description: null, productCount: 5 },
  { id: "cocktails", name: "Cocktails & Vins", icon_emoji: "🍷", description: "Sélection soignée, accord mets-vins", productCount: 4 },
];

const DEMO_PRODUCTS: Record<string, PublicProduct[]> = {
  entrees: [
    { id: "e1", name: "Edamame", price: 5, description: "Fèves de soja grillées au sel de Guérande", tags: ["vegetarian", "soybeans"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400" },
    { id: "e2", name: "Gyoza poulet", price: 8, description: "6 pièces, sauce ponzu maison", tags: ["gluten", "soybeans", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
    { id: "e3", name: "Tataki de thon", price: 14, description: "Thon rouge mi-cuit, sésame, vinaigrette yuzu", tags: ["fish", "sesame", "soybeans"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400" },
    { id: "e4", name: "Soupe miso", price: 6, description: "Tofu, wakame, oignon nouveau", tags: ["vegetarian", "soybeans"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400" },
  ],
  plats: [
    { id: "p1", name: "Ramen tonkotsu", price: 16, description: "Bouillon 12h, porc chashu, œuf mollet, nori", tags: ["gluten", "eggs", "soybeans", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400" },
    {
      id: "p2",
      name: "Chirashi saumon",
      price: 19,
      description: "Riz vinaigré, saumon frais, avocat, tobiko",
      tags: ["fish", "soybeans", "sesame", "eggs"],
      option_label: null,
      is_available: true,
      image_url: "https://images.unsplash.com/photo-1742349166781-70e38f10b7ed?w=800&q=80",
    },
    { id: "p3", name: "Poulet teriyaki", price: 15, description: "Cuisse fermière laquée, riz japonais, légumes de saison", tags: ["gluten", "soybeans", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400" },
    { id: "p4", name: "Curry katsu", price: 17, description: "Porc pané, curry japonais doux, riz, pickles", tags: ["gluten", "eggs", "mustard"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400" },
    { id: "p5", name: "Bowl veggie", price: 14, description: "Tofu croustillant, avocat, edamame, riz, sauce sésame", tags: ["vegetarian", "soybeans", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400" },
  ],
  sushis: [
    { id: "s1", name: "Assortiment 12 pièces", price: 18, description: "4 nigiri, 4 maki, 4 california", tags: ["fish", "soybeans", "sesame"], option_label: "Sauce soja sucrée ou salée ?", is_available: true, image_url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400" },
    { id: "s2", name: "Assortiment 18 pièces", price: 26, description: "6 nigiri, 6 maki, 6 california", tags: ["fish", "soybeans", "sesame"], option_label: "Sauce soja sucrée ou salée ?", is_available: true, image_url: "https://images.unsplash.com/photo-1709984110217-57d7d18e5299?w=400" },
    { id: "s3", name: "Maki avocat (6p)", price: 7, description: "Maki végétarien classique", tags: ["vegetarian", "soybeans", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=400" },
    { id: "s4", name: "Maki saumon (6p)", price: 9, description: "Saumon frais, riz vinaigré, nori", tags: ["fish", "soybeans"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400" },
  ],
  desserts: [
    { id: "d1", name: "Mochi glacé (3p)", price: 8, description: "Matcha, sésame noir, yuzu", tags: ["vegetarian", "milk", "sesame"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400" },
    { id: "d2", name: "Cheesecake yuzu", price: 9, description: "Style basque, crème yuzu", tags: ["vegetarian", "milk", "eggs", "gluten"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=400" },
    { id: "d3", name: "Fondant matcha", price: 10, description: "Cœur coulant thé vert, glace vanille", tags: ["vegetarian", "milk", "eggs", "gluten"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400" },
  ],
  boissons: [
    { id: "b1", name: "Thé matcha latte", price: 5, description: "Chaud ou froid", tags: ["vegetarian", "milk"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400" },
    { id: "b2", name: "Limonade yuzu", price: 6, description: "Fraîche, sucrée, acidulée", tags: ["vegetarian"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
    { id: "b3", name: "Saké junmai (15cl)", price: 9, description: "Saké pur riz, sec et rond", tags: ["sulphites"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400" },
    { id: "b4", name: "Bière Asahi (33cl)", price: 5, description: "Lager japonaise légère", tags: ["gluten", "sulphites"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400" },
    { id: "b5", name: "Coca / Coca zéro", price: 3.5, description: null, tags: [], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400" },
  ],
  cocktails: [
    { id: "c1", name: "Yuzu Spritz", price: 10, description: "Yuzu, prosecco, eau pétillante, shiso", tags: ["sulphites"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400" },
    { id: "c2", name: "Soda au gingembre", price: 7, description: "Maison, frais, légèrement épicé", tags: ["vegetarian", "vegan"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
    { id: "c3", name: "Vin blanc Burgundy (15cl)", price: 8, description: "Chablis Premier Cru, notes minérales", tags: ["sulphites"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400" },
    { id: "c4", name: "Sake premium (8cl)", price: 12, description: "Daiginjo, arômes floraux et fruités", tags: ["sulphites"], option_label: null, is_available: true, image_url: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400" },
  ],
};

/** Photos vitrine (même modèle que Supabase) : sans entrée visible, la tuile galerie n’est pas rendue. */
const DEMO_STOREFRONT_PHOTOS: StorefrontPhoto[] = [
  {
    id: "demo-gallery-1",
    image_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    caption: "Ambiance salle",
    is_visible: true,
    display_order: 0,
  },
];

const DEMO_BUNDLES: BundleInfo[] = [
  {
    id: "f1", name: "Formule Midi", description: "1 entrée + 1 plat", price: 19, image_url: null,
    slots: [
      { label: "Entrée", quantity: 1, categoryName: "Entrées", categoryEmoji: "🥢", categoryId: "entrees", excludedProductIds: [] },
      { label: "Plat", quantity: 1, categoryName: "Plats", categoryEmoji: "🍜", categoryId: "plats", excludedProductIds: [] },
    ],
  },
  {
    id: "f2", name: "Formule Découverte", description: "1 entrée + 1 plat + 1 dessert", price: 28, image_url: null,
    slots: [
      { label: "Entrée", quantity: 1, categoryName: "Entrées", categoryEmoji: "🥢", categoryId: "entrees", excludedProductIds: [] },
      { label: "Plat", quantity: 1, categoryName: "Plats", categoryEmoji: "🍜", categoryId: "plats", excludedProductIds: [] },
      { label: "Dessert", quantity: 1, categoryName: "Desserts", categoryEmoji: "🍰", categoryId: "desserts", excludedProductIds: [] },
    ],
  },
  {
    id: "f3", name: "Formule Omakase", description: "Entrée + Plat + Dessert + Boisson", price: 45, image_url: null,
    slots: [
      { label: "Entrée", quantity: 1, categoryName: "Entrées", categoryEmoji: "🥢", categoryId: "entrees", excludedProductIds: [] },
      { label: "Plat", quantity: 1, categoryName: "Plats", categoryEmoji: "🍜", categoryId: "plats", excludedProductIds: [] },
      { label: "Dessert", quantity: 1, categoryName: "Desserts", categoryEmoji: "🍰", categoryId: "desserts", excludedProductIds: [] },
      { label: "Boisson", quantity: 1, categoryName: "Boissons", categoryEmoji: "🍶", categoryId: "boissons", excludedProductIds: [] },
    ],
  },
];

// ── Main DemoView ───────────────────────────────────────────────

export function DemoView() {
  return (
    <CartProvider shopSlug="demo">
      <PublicShopProvider
        shop={{
          id: "demo",
          slug: "demo",
          name: "Maison Kanpai",
          stripeAccountId: null,
          fulfillmentModes: ["dine_in", "takeaway"],
          isDemoMode: true,
        }}
      >
        <CartDrawerProvider>
          <StorefrontThemeScope themeKey={DEFAULT_CATEGORY_THEME_KEY} className="min-h-screen">
            <div className="flex min-h-screen flex-col bg-transparent">
              <div className="sticky top-0 z-50 bg-transparent p-[4px]">
                <DemoUnifiedTopBar />
              </div>

              {/* ── Contenu principal (ISO avec la vraie page) ── */}
              <main className="flex-1 mx-auto w-full max-w-5xl px-0 py-8 pb-32 sm:px-4">
                <StoreView
                  shop={DEMO_SHOP}
                  categories={DEMO_CATEGORIES}
                  bundles={DEMO_BUNDLES}
                  storefrontPhotos={DEMO_STOREFRONT_PHOTOS}
                  savedStorefrontLayout={null}
                  loadCategoryProducts={(categoryId) =>
                    Promise.resolve(DEMO_PRODUCTS[categoryId] ?? [])
                  }
                />
              </main>
            </div>
          </StorefrontThemeScope>

          {/* ── Panier (composants réels) ── */}
          <CartButton />
          <CartDrawer />

        </CartDrawerProvider>
      </PublicShopProvider>
    </CartProvider>
  );
}
