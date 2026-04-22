const PRODUCT_VARIANTS = [
  { fr: "Classique", en: "Classic", priceDelta: 0 },
  { fr: "Signature", en: "Signature", priceDelta: 1.5 },
  { fr: "Premium", en: "Premium", priceDelta: 2.5 },
  { fr: "Maison", en: "House", priceDelta: 1 },
  { fr: "Saison", en: "Seasonal", priceDelta: 1.2 },
  { fr: "Chef", en: "Chef's", priceDelta: 2 },
  { fr: "Express", en: "Express", priceDelta: -0.8 },
  { fr: "Grand Format", en: "Large", priceDelta: 3 },
];

const DEFAULT_LABELS = [
  { value: "vegan", label_fr: "Vegan", label_en: "Vegan", color: "#15803d" },
  { value: "vegetarian", label_fr: "Vegetarien", label_en: "Vegetarian", color: "#166534" },
  { value: "gluten_free", label_fr: "Sans gluten", label_en: "Gluten-free", color: "#b45309" },
  { value: "organic", label_fr: "Bio", label_en: "Organic", color: "#047857" },
  { value: "spicy", label_fr: "Epice", label_en: "Spicy", color: "#b91c1c" },
  { value: "homemade", label_fr: "Fait maison", label_en: "Homemade", color: "#6d28d9" },
  { value: "new", label_fr: "Nouveau", label_en: "New", color: "#1d4ed8" },
  { value: "bestseller", label_fr: "Best-seller", label_en: "Best-seller", color: "#c2410c" },
];

function toSlug(source) {
  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildProductsForCategory(shopKey, category, audience) {
  return PRODUCT_VARIANTS.map((variant, index) => {
    const tags = [];
    if (index % 2 === 0) tags.push("bestseller");
    if (index === 2 || index === 4) tags.push("new");
    if (category.tagHint) tags.push(category.tagHint);
    if (category.allergenHint) tags.push(category.allergenHint);
    if (category.veganFriendly && (index === 0 || index === 6)) tags.push("vegan");
    if (category.glutenFreeFriendly && index === 4) tags.push("gluten_free");
    return {
      key: `${shopKey}-${category.key}-${index + 1}`,
      name_fr: `${category.name_fr} ${variant.fr}`,
      name_en: `${category.name_en} ${variant.en}`,
      description_fr: `${category.pitch_fr} Pense pour ${audience.fr}.`,
      description_en: `${category.pitch_en} Built for ${audience.en}.`,
      option_label_fr: category.option_label_fr ?? null,
      option_label_en: category.option_label_en ?? null,
      price: Number((category.base_price + variant.priceDelta).toFixed(2)),
      tags: [...new Set(tags)],
      is_available: true,
      display_order: index + 1,
    };
  });
}

function buildShopBlueprint(raw) {
  const categories = raw.categories.map((category, index) => ({
    key: category.key,
    name_fr: category.name_fr,
    name_en: category.name_en,
    description_fr: category.description_fr,
    description_en: category.description_en,
    icon_emoji: category.icon_emoji,
    display_order: index + 1,
    is_active: true,
    products: buildProductsForCategory(raw.key, category, raw.audience),
  }));

  const bundles = raw.bundles.map((bundle) => ({
    key: bundle.key,
    name_fr: bundle.name_fr,
    name_en: bundle.name_en,
    description_fr: bundle.description_fr,
    description_en: bundle.description_en,
    price: bundle.price,
    display_order: bundle.display_order,
    is_active: true,
    slots: bundle.slots.map((slot, slotIndex) => ({
      key: `${bundle.key}-${slot.category_key}`,
      category_key: slot.category_key,
      label_fr: slot.label_fr,
      label_en: slot.label_en,
      quantity: slot.quantity,
      display_order: slotIndex + 1,
      excluded_product_keys: [],
    })),
  }));

  return {
    ...raw,
    slug: raw.slug ?? `${toSlug(raw.shop_name_fr)}-local`,
    categories,
    bundles,
    labels: DEFAULT_LABELS,
  };
}

export const LOCAL_MULTI_STOREFRONT_BLUEPRINTS = [
  buildShopBlueprint({
    key: "sushi-premium",
    audience: { fr: "les actifs urbains premium", en: "premium urban professionals" },
    owner: { email: "owner.sushi.premium@bento.local", password: "BentoLocal-2026-01!", full_name: "Aiko Tanaka" },
    shop_name_fr: "Aoi Signature Sushi",
    shop_name_en: "Aoi Signature Sushi",
    shop_description_fr: "Comptoir japonais premium pour dejeuners rapides et diners soignes.",
    shop_description_en: "Premium Japanese counter for quick lunches and refined dinners.",
    shop_type: "restaurant",
    storefront_theme_key: "blue",
    fulfillment_modes: ["dine_in", "takeaway", "delivery"],
    bundles_menu_grouped: true,
    categories: [
      { key: "signature-rolls", name_fr: "Rolls signature", name_en: "Signature rolls", description_fr: "Les incontournables maison.", description_en: "House must-have rolls.", pitch_fr: "Texture nette et riz assaisonne minute.", pitch_en: "Clean texture and minute-seasoned rice.", icon_emoji: "🍣", base_price: 13.9, tagHint: "bestseller", allergenHint: "fish" },
      { key: "nigiri-sashimi", name_fr: "Nigiri & sashimi", name_en: "Nigiri & sashimi", description_fr: "Pieces premium coupees a la commande.", description_en: "Premium pieces cut to order.", pitch_fr: "Poisson premium et coupe precise.", pitch_en: "Premium fish and precise cuts.", icon_emoji: "🐟", base_price: 15.9, tagHint: "new", allergenHint: "fish", glutenFreeFriendly: true },
      { key: "chirashi-bowls", name_fr: "Chirashi bowls", name_en: "Chirashi bowls", description_fr: "Bol complet pour pause dejeuner business.", description_en: "Full bowls for business lunch breaks.", pitch_fr: "Portion complete et equilibre proteine.", pitch_en: "Complete portions with balanced protein.", icon_emoji: "🥣", base_price: 14.5, tagHint: "homemade", allergenHint: "fish" },
      { key: "hot-dishes", name_fr: "Plats chauds", name_en: "Hot dishes", description_fr: "Recettes japonaises chaudes express.", description_en: "Fast warm Japanese dishes.", pitch_fr: "Cuisson minute et sauce maison.", pitch_en: "Cooked to order with house sauces.", icon_emoji: "🔥", base_price: 12.9, tagHint: "spicy", allergenHint: "soybeans" },
      { key: "small-plates", name_fr: "Petites assiettes", name_en: "Small plates", description_fr: "Accompagnements a partager.", description_en: "Side plates to share.", pitch_fr: "Formats degustation pour afterwork.", pitch_en: "Tasting sizes for after-work bites.", icon_emoji: "🥢", base_price: 6.5, tagHint: "new", allergenHint: "sesame", veganFriendly: true },
      { key: "desserts-matcha", name_fr: "Desserts matcha", name_en: "Matcha desserts", description_fr: "Finitions legeres et gourmandes.", description_en: "Light yet indulgent finishers.", pitch_fr: "Final frais et peu sucre.", pitch_en: "Fresh finish with moderate sweetness.", icon_emoji: "🍵", base_price: 7.9, tagHint: "organic", allergenHint: "milk", glutenFreeFriendly: true },
      { key: "mocktails", name_fr: "Mocktails yuzu", name_en: "Yuzu mocktails", description_fr: "Boissons premium sans alcool.", description_en: "Premium non-alcoholic drinks.", pitch_fr: "Notes d agrumes japonaises.", pitch_en: "Japanese citrus-forward notes.", icon_emoji: "🍸", base_price: 5.9, tagHint: "organic", allergenHint: "sulphites", veganFriendly: true, glutenFreeFriendly: true },
      { key: "executive-lunch", name_fr: "Executive lunch", name_en: "Executive lunch", description_fr: "Menus calibres pour midi rapide.", description_en: "Lunch menus designed for speed.", pitch_fr: "Pret en moins de 12 minutes.", pitch_en: "Ready in under 12 minutes.", icon_emoji: "💼", base_price: 16.9, tagHint: "bestseller", allergenHint: "fish" },
    ],
    bundles: [
      { key: "lunch-express", name_fr: "Lunch express", name_en: "Express lunch", description_fr: "Combo midi pour actifs presses.", description_en: "Lunch combo for busy professionals.", price: 21.9, display_order: 1, slots: [{ category_key: "signature-rolls", label_fr: "Choix du roll", label_en: "Roll choice", quantity: 1 }, { category_key: "small-plates", label_fr: "Accompagnement", label_en: "Side", quantity: 1 }, { category_key: "mocktails", label_fr: "Boisson", label_en: "Drink", quantity: 1 }] },
      { key: "premium-omakase", name_fr: "Omakase premium", name_en: "Premium omakase", description_fr: "Experience degustation en 3 temps.", description_en: "Three-course tasting experience.", price: 38.9, display_order: 2, slots: [{ category_key: "nigiri-sashimi", label_fr: "Selection poisson", label_en: "Fish selection", quantity: 1 }, { category_key: "hot-dishes", label_fr: "Plat chaud", label_en: "Hot dish", quantity: 1 }, { category_key: "desserts-matcha", label_fr: "Dessert", label_en: "Dessert", quantity: 1 }] },
      { key: "afterwork-box", name_fr: "Box afterwork", name_en: "After-work box", description_fr: "Format partage pour fin de journee.", description_en: "Shareable set for evening gatherings.", price: 44.5, display_order: 3, slots: [{ category_key: "chirashi-bowls", label_fr: "Base", label_en: "Base", quantity: 1 }, { category_key: "small-plates", label_fr: "Bouchees", label_en: "Bites", quantity: 2 }, { category_key: "mocktails", label_fr: "Mocktails", label_en: "Mocktails", quantity: 2 }] },
    ],
  }),
  buildShopBlueprint({
    key: "boulangerie-quartier",
    audience: { fr: "les familles et voisins du quartier", en: "local families and neighbors" },
    owner: { email: "owner.boulangerie.quartier@bento.local", password: "BentoLocal-2026-02!", full_name: "Claire Martin" },
    shop_name_fr: "Le Four du Quartier",
    shop_name_en: "Neighborhood Oven",
    shop_description_fr: "Boulangerie artisanale de quartier, production journee continue.",
    shop_description_en: "Neighborhood artisan bakery with all-day production.",
    shop_type: "bakery",
    storefront_theme_key: "amber",
    fulfillment_modes: ["dine_in", "takeaway"],
    bundles_menu_grouped: false,
    categories: [
      { key: "pains-du-jour", name_fr: "Pains du jour", name_en: "Daily breads", description_fr: "Fours artisanaux, cuisson en continu.", description_en: "Artisan breads baked throughout the day.", pitch_fr: "Croquant exterieur et mie aerienne.", pitch_en: "Crunchy crust with airy crumb.", icon_emoji: "🍞", base_price: 2.4, tagHint: "homemade", allergenHint: "gluten" },
      { key: "viennoiseries", name_fr: "Viennoiseries", name_en: "Pastries", description_fr: "Selection matinale incontournable.", description_en: "Essential morning pastry lineup.", pitch_fr: "Beurre AOP et faconnage quotidien.", pitch_en: "AOP butter and daily shaping.", icon_emoji: "🥐", base_price: 1.8, tagHint: "bestseller", allergenHint: "eggs" },
      { key: "sandwiches", name_fr: "Sandwichs", name_en: "Sandwiches", description_fr: "Formules dejeuner pretes a emporter.", description_en: "Grab-and-go lunch sandwiches.", pitch_fr: "Assemblage minute sur pain du jour.", pitch_en: "Made-to-order with fresh bread.", icon_emoji: "🥪", base_price: 6.9, tagHint: "new", allergenHint: "gluten" },
      { key: "salades-bols", name_fr: "Salades & bols", name_en: "Salads & bowls", description_fr: "Options legeres pour midi.", description_en: "Light lunch options.", pitch_fr: "Recettes equilibrant fraicheur et satiete.", pitch_en: "Fresh recipes balancing nutrition and satiety.", icon_emoji: "🥗", base_price: 7.4, tagHint: "organic", allergenHint: "mustard", veganFriendly: true, glutenFreeFriendly: true },
      { key: "patisseries", name_fr: "Patisseries", name_en: "Pastry desserts", description_fr: "Desserts individuels et gateaux maison.", description_en: "Individual desserts and house cakes.", pitch_fr: "Gourmandise classique et saisonniere.", pitch_en: "Classic and seasonal indulgence.", icon_emoji: "🍰", base_price: 4.9, tagHint: "new", allergenHint: "milk" },
      { key: "snacking-enfant", name_fr: "Snacking enfant", name_en: "Kids snacks", description_fr: "Formats pratiques apres ecole.", description_en: "After-school snack formats.", pitch_fr: "Portions adaptees aux familles.", pitch_en: "Family-friendly portions.", icon_emoji: "🧃", base_price: 3.5, tagHint: "vegetarian", allergenHint: "nuts" },
      { key: "boissons-chaudes", name_fr: "Boissons chaudes", name_en: "Hot drinks", description_fr: "Cafe, chocolat, infusions.", description_en: "Coffee, chocolate and infusions.", pitch_fr: "Blend maison et extraction stable.", pitch_en: "House blends with stable extraction.", icon_emoji: "☕", base_price: 2.7, tagHint: "organic", allergenHint: "milk" },
      { key: "brunch-weekend", name_fr: "Brunch weekend", name_en: "Weekend brunch", description_fr: "Plateaux week-end pour familles.", description_en: "Weekend platters for families.", pitch_fr: "Format convivial a partager.", pitch_en: "Friendly shareable sets.", icon_emoji: "🧺", base_price: 12.5, tagHint: "bestseller", allergenHint: "gluten" },
    ],
    bundles: [
      { key: "petit-dej-famille", name_fr: "Petit dej famille", name_en: "Family breakfast", description_fr: "Pack matin pour 2 a 4 personnes.", description_en: "Morning pack for 2 to 4 people.", price: 19.9, display_order: 1, slots: [{ category_key: "viennoiseries", label_fr: "Viennoiserie", label_en: "Pastry", quantity: 2 }, { category_key: "boissons-chaudes", label_fr: "Boisson chaude", label_en: "Hot drink", quantity: 2 }, { category_key: "patisseries", label_fr: "Douceur", label_en: "Sweet treat", quantity: 1 }] },
      { key: "dej-quartier", name_fr: "Dej quartier", name_en: "Neighborhood lunch", description_fr: "Sandwich + side + boisson.", description_en: "Sandwich + side + drink.", price: 13.5, display_order: 2, slots: [{ category_key: "sandwiches", label_fr: "Sandwich", label_en: "Sandwich", quantity: 1 }, { category_key: "salades-bols", label_fr: "Side", label_en: "Side", quantity: 1 }, { category_key: "boissons-chaudes", label_fr: "Boisson", label_en: "Drink", quantity: 1 }] },
      { key: "brunch-dimanche", name_fr: "Brunch dimanche", name_en: "Sunday brunch", description_fr: "Composition complete du dimanche.", description_en: "Complete Sunday composition.", price: 29.9, display_order: 3, slots: [{ category_key: "brunch-weekend", label_fr: "Base brunch", label_en: "Brunch base", quantity: 1 }, { category_key: "viennoiseries", label_fr: "Viennoiserie", label_en: "Pastry", quantity: 2 }, { category_key: "boissons-chaudes", label_fr: "Boisson", label_en: "Drink", quantity: 2 }] },
    ],
  }),
  buildShopBlueprint({
    key: "coffee-remote",
    audience: { fr: "les etudiants et freelances nomades", en: "students and remote freelancers" },
    owner: { email: "owner.coffee.remote@bento.local", password: "BentoLocal-2026-03!", full_name: "Leo Bernard" },
    shop_name_fr: "Nomad Brew Club",
    shop_name_en: "Nomad Brew Club",
    shop_description_fr: "Coffee & brunch optimise pour sessions de travail longues.",
    shop_description_en: "Coffee and brunch designed for long work sessions.",
    shop_type: "cafe",
    storefront_theme_key: "turquoise",
    fulfillment_modes: ["dine_in", "takeaway"],
    bundles_menu_grouped: true,
    categories: [
      { key: "espresso-bar", name_fr: "Espresso bar", name_en: "Espresso bar", description_fr: "Extraction specialty stable toute la journee.", description_en: "All-day specialty extraction.", pitch_fr: "Cafe precis et rapide entre deux reunions.", pitch_en: "Precise coffee between back-to-back meetings.", icon_emoji: "☕", base_price: 3.2, tagHint: "bestseller", allergenHint: "milk" },
      { key: "cold-brews", name_fr: "Cold brews", name_en: "Cold brews", description_fr: "Options froides pour sessions longues.", description_en: "Cold options for long sessions.", pitch_fr: "Fraicheur cafeinee sans lourdeur.", pitch_en: "Refreshing caffeine without heaviness.", icon_emoji: "🧊", base_price: 4.8, tagHint: "new", allergenHint: "milk", veganFriendly: true, glutenFreeFriendly: true },
      { key: "brunch-plates", name_fr: "Brunch plates", name_en: "Brunch plates", description_fr: "Assiettes completes pour coworking.", description_en: "Complete plates for coworking days.", pitch_fr: "Formats rassasiants et lisibles.", pitch_en: "Satisfying and straightforward formats.", icon_emoji: "🍳", base_price: 10.9, tagHint: "homemade", allergenHint: "eggs" },
      { key: "protein-bowls", name_fr: "Protein bowls", name_en: "Protein bowls", description_fr: "Recettes nutritionnelles pour concentration.", description_en: "Nutrition-first bowls for focus.", pitch_fr: "Energie stable sans pic sucre.", pitch_en: "Steady energy without sugar spikes.", icon_emoji: "🥣", base_price: 11.7, tagHint: "organic", allergenHint: "nuts", glutenFreeFriendly: true },
      { key: "toasts-wraps", name_fr: "Toasts & wraps", name_en: "Toasts & wraps", description_fr: "Formats rapides entre calls.", description_en: "Quick bites between calls.", pitch_fr: "Pret a servir en moins de 5 minutes.", pitch_en: "Served in under 5 minutes.", icon_emoji: "🌯", base_price: 8.2, tagHint: "bestseller", allergenHint: "gluten" },
      { key: "sweet-bites", name_fr: "Sweet bites", name_en: "Sweet bites", description_fr: "Patisseries courtes anti-coup de mou.", description_en: "Small pastries to fight energy dips.", pitch_fr: "Portions individuelles anti-gaspillage.", pitch_en: "Single portions to avoid waste.", icon_emoji: "🧁", base_price: 4.6, tagHint: "new", allergenHint: "eggs" },
      { key: "focus-snacks", name_fr: "Focus snacks", name_en: "Focus snacks", description_fr: "En-cas cerveau et satiete.", description_en: "Brain food and satiety snacks.", pitch_fr: "Mastication legere et micronutriments.", pitch_en: "Light chewing with micronutrient focus.", icon_emoji: "🥜", base_price: 3.9, tagHint: "vegan", allergenHint: "nuts", veganFriendly: true, glutenFreeFriendly: true },
      { key: "group-combos", name_fr: "Group combos", name_en: "Group combos", description_fr: "Plateaux pour sessions d equipe.", description_en: "Platters for team sessions.", pitch_fr: "Parfait pour stand-up et ateliers.", pitch_en: "Perfect for stand-ups and workshops.", icon_emoji: "👥", base_price: 14.5, tagHint: "bestseller", allergenHint: "gluten" },
    ],
    bundles: [
      { key: "focus-morning", name_fr: "Morning focus", name_en: "Morning focus", description_fr: "Cafe + snack + bowl pour demarrage net.", description_en: "Coffee + snack + bowl for a sharp start.", price: 15.2, display_order: 1, slots: [{ category_key: "espresso-bar", label_fr: "Cafe", label_en: "Coffee", quantity: 1 }, { category_key: "focus-snacks", label_fr: "Snack", label_en: "Snack", quantity: 1 }, { category_key: "protein-bowls", label_fr: "Bowl", label_en: "Bowl", quantity: 1 }] },
      { key: "cowork-lunch", name_fr: "Cowork lunch", name_en: "Cowork lunch", description_fr: "Formule dejeuner coworking.", description_en: "Coworking lunch formula.", price: 18.4, display_order: 2, slots: [{ category_key: "brunch-plates", label_fr: "Plat", label_en: "Plate", quantity: 1 }, { category_key: "toasts-wraps", label_fr: "Complement", label_en: "Complement", quantity: 1 }, { category_key: "cold-brews", label_fr: "Boisson", label_en: "Drink", quantity: 1 }] },
      { key: "team-jam", name_fr: "Team jam", name_en: "Team jam", description_fr: "Pack partage pour sessions de groupe.", description_en: "Share pack for group sessions.", price: 33.8, display_order: 3, slots: [{ category_key: "group-combos", label_fr: "Base partage", label_en: "Share base", quantity: 1 }, { category_key: "sweet-bites", label_fr: "Douceurs", label_en: "Sweet bites", quantity: 2 }, { category_key: "cold-brews", label_fr: "Cold brew", label_en: "Cold brew", quantity: 2 }] },
    ],
  }),
  buildShopBlueprint({
    key: "foodtruck-event",
    audience: { fr: "les festivaliers et publics evenementiels", en: "festival and event audiences" },
    owner: { email: "owner.foodtruck.event@bento.local", password: "BentoLocal-2026-04!", full_name: "Max Dubois" },
    shop_name_fr: "Street Bento Truck",
    shop_name_en: "Street Bento Truck",
    shop_description_fr: "Foodtruck haute cadence pour commandes en flux continu.",
    shop_description_en: "High-throughput food truck for continuous order flow.",
    shop_type: "foodtruck",
    storefront_theme_key: "rose",
    fulfillment_modes: ["takeaway", "delivery"],
    bundles_menu_grouped: true,
    categories: [
      { key: "smash-burgers", name_fr: "Smash burgers", name_en: "Smash burgers", description_fr: "Burgers rapides, cuisson plaque.", description_en: "Fast griddle-cooked burgers.", pitch_fr: "Recettes lisibles pour file d attente courte.", pitch_en: "Simple recipes for short queues.", icon_emoji: "🍔", base_price: 9.9, tagHint: "bestseller", allergenHint: "gluten" },
      { key: "loaded-fries", name_fr: "Loaded fries", name_en: "Loaded fries", description_fr: "Portions croustillantes et toppings.", description_en: "Crispy fries with toppings.", pitch_fr: "Accompagnements tres partageables.", pitch_en: "Highly shareable side portions.", icon_emoji: "🍟", base_price: 5.2, tagHint: "spicy", allergenHint: "milk" },
      { key: "tacos-wraps", name_fr: "Tacos & wraps", name_en: "Tacos & wraps", description_fr: "Formats roulables faciles a manger debout.", description_en: "Handheld formats easy to eat standing.", pitch_fr: "Mangeable en marchant sans perte.", pitch_en: "Easy to eat while walking.", icon_emoji: "🌮", base_price: 8.8, tagHint: "new", allergenHint: "gluten" },
      { key: "street-bowls", name_fr: "Street bowls", name_en: "Street bowls", description_fr: "Alternatives plus legeres.", description_en: "Lighter alternatives.", pitch_fr: "Version bol sans compromettre le gout.", pitch_en: "Bowl format without sacrificing flavor.", icon_emoji: "🥙", base_price: 9.2, tagHint: "gluten_free", allergenHint: "soybeans", glutenFreeFriendly: true },
      { key: "festival-snacks", name_fr: "Festival snacks", name_en: "Festival snacks", description_fr: "Bouchees rapides avant concert.", description_en: "Quick bites before the show.", pitch_fr: "Service en moins de 3 minutes.", pitch_en: "Served in under 3 minutes.", icon_emoji: "🎪", base_price: 4.4, tagHint: "bestseller", allergenHint: "sesame" },
      { key: "sweet-street", name_fr: "Sweet street", name_en: "Sweet street", description_fr: "Desserts nomades.", description_en: "Street-friendly desserts.", pitch_fr: "Format portable sans couverts.", pitch_en: "Portable format requiring no cutlery.", icon_emoji: "🍩", base_price: 4.1, tagHint: "new", allergenHint: "eggs" },
      { key: "soft-drinks", name_fr: "Soft drinks", name_en: "Soft drinks", description_fr: "Hydratation rapide.", description_en: "Quick hydration.", pitch_fr: "Carte boisson concise et efficace.", pitch_en: "Focused and efficient drink menu.", icon_emoji: "🥤", base_price: 2.9, tagHint: "organic", allergenHint: "sulphites", veganFriendly: true, glutenFreeFriendly: true },
      { key: "afterparty-packs", name_fr: "Afterparty packs", name_en: "Afterparty packs", description_fr: "Packs groupe pour fin de soiree.", description_en: "Group packs for late-night sessions.", pitch_fr: "Volume genereux pour les groupes.", pitch_en: "Generous volume for groups.", icon_emoji: "🎉", base_price: 17.9, tagHint: "bestseller", allergenHint: "gluten" },
    ],
    bundles: [
      { key: "rush-hour", name_fr: "Rush hour", name_en: "Rush hour", description_fr: "Combo rapide file d attente.", description_en: "Fast queue-friendly combo.", price: 14.9, display_order: 1, slots: [{ category_key: "smash-burgers", label_fr: "Burger", label_en: "Burger", quantity: 1 }, { category_key: "loaded-fries", label_fr: "Fries", label_en: "Fries", quantity: 1 }, { category_key: "soft-drinks", label_fr: "Soft", label_en: "Soft", quantity: 1 }] },
      { key: "concert-bundle", name_fr: "Concert bundle", name_en: "Concert bundle", description_fr: "Avant-scene: wraps + snack + boisson.", description_en: "Pre-show wraps + snack + drink.", price: 16.8, display_order: 2, slots: [{ category_key: "tacos-wraps", label_fr: "Wrap", label_en: "Wrap", quantity: 1 }, { category_key: "festival-snacks", label_fr: "Snack", label_en: "Snack", quantity: 1 }, { category_key: "soft-drinks", label_fr: "Boisson", label_en: "Drink", quantity: 1 }] },
      { key: "crew-pack", name_fr: "Crew pack", name_en: "Crew pack", description_fr: "Pack groupe equipe ou amis.", description_en: "Group pack for crew or friends.", price: 39.5, display_order: 3, slots: [{ category_key: "afterparty-packs", label_fr: "Base", label_en: "Base", quantity: 1 }, { category_key: "street-bowls", label_fr: "Bowls", label_en: "Bowls", quantity: 2 }, { category_key: "sweet-street", label_fr: "Desserts", label_en: "Desserts", quantity: 2 }] },
    ],
  }),
  buildShopBlueprint({
    key: "traiteur-b2b",
    audience: { fr: "les office managers et achats entreprise", en: "office managers and corporate buyers" },
    owner: { email: "owner.traiteur.b2b@bento.local", password: "BentoLocal-2026-05!", full_name: "Sophie Garnier" },
    shop_name_fr: "Bento Office Catering",
    shop_name_en: "Bento Office Catering",
    shop_description_fr: "Traiteur B2B pour reunions, formations et events corporate.",
    shop_description_en: "B2B catering for meetings, trainings and corporate events.",
    shop_type: "catering",
    storefront_theme_key: "neutral",
    fulfillment_modes: ["delivery", "takeaway"],
    bundles_menu_grouped: true,
    categories: [
      { key: "plateaux-sales", name_fr: "Plateaux sales", name_en: "Savory platters", description_fr: "Plateaux reunion modulables.", description_en: "Modular meeting platters.", pitch_fr: "Decoupe propre et partage facile.", pitch_en: "Clean cuts and easy sharing.", icon_emoji: "🥪", base_price: 22.9, tagHint: "bestseller", allergenHint: "gluten" },
      { key: "plateaux-veggie", name_fr: "Plateaux veggie", name_en: "Veggie platters", description_fr: "Alternatives vegetarian et vegan.", description_en: "Vegetarian and vegan alternatives.", pitch_fr: "Selection inclusive pour toutes equipes.", pitch_en: "Inclusive options for diverse teams.", icon_emoji: "🥬", base_price: 20.5, tagHint: "vegetarian", allergenHint: "sesame", veganFriendly: true, glutenFreeFriendly: true },
      { key: "mini-bocaux", name_fr: "Mini bocaux", name_en: "Mini jars", description_fr: "Formats individuels prets a distribuer.", description_en: "Individual ready-to-distribute formats.", pitch_fr: "Pratique pour ateliers itinerants.", pitch_en: "Practical for moving workshops.", icon_emoji: "🫙", base_price: 6.9, tagHint: "new", allergenHint: "mustard" },
      { key: "plats-chauds", name_fr: "Plats chauds", name_en: "Hot mains", description_fr: "Solutions chaudes livraison midi.", description_en: "Hot delivery-friendly lunch options.", pitch_fr: "Maintien en temperature optimise.", pitch_en: "Optimized heat retention.", icon_emoji: "🍛", base_price: 13.8, tagHint: "homemade", allergenHint: "milk" },
      { key: "desserts-bureau", name_fr: "Desserts bureau", name_en: "Office desserts", description_fr: "Desserts individuels corporate.", description_en: "Corporate-friendly individual desserts.", pitch_fr: "Presentation nette en salle de reunion.", pitch_en: "Clean presentation in meeting rooms.", icon_emoji: "🍮", base_price: 5.2, tagHint: "new", allergenHint: "eggs" },
      { key: "boissons-event", name_fr: "Boissons event", name_en: "Event drinks", description_fr: "Boissons sans alcool pour plateaux.", description_en: "Non-alcoholic drinks for platters.", pitch_fr: "Hydratation simple pour grands groupes.", pitch_en: "Simple hydration for large groups.", icon_emoji: "🧃", base_price: 3.6, tagHint: "organic", allergenHint: "sulphites", veganFriendly: true, glutenFreeFriendly: true },
      { key: "petit-dej-corp", name_fr: "Petit dej corp", name_en: "Corporate breakfast", description_fr: "Accueil matin pour equipes.", description_en: "Morning welcome sets for teams.", pitch_fr: "Format brief matin et comite de direction.", pitch_en: "Made for morning briefs and leadership meetings.", icon_emoji: "🥐", base_price: 8.9, tagHint: "bestseller", allergenHint: "gluten" },
      { key: "packs-seminaire", name_fr: "Packs seminaire", name_en: "Seminar packs", description_fr: "Packs complets demi-journee ou journee.", description_en: "Half-day or full-day complete packs.", pitch_fr: "Pilotage simple des volumes.", pitch_en: "Easy volume planning and execution.", icon_emoji: "📦", base_price: 29.5, tagHint: "bestseller", allergenHint: "gluten" },
    ],
    bundles: [
      { key: "meeting-10", name_fr: "Meeting 10 pers", name_en: "10-people meeting", description_fr: "Set complet pour reunion 10 personnes.", description_en: "Complete set for 10-person meetings.", price: 119, display_order: 1, slots: [{ category_key: "plateaux-sales", label_fr: "Plateau sale", label_en: "Savory platter", quantity: 1 }, { category_key: "plateaux-veggie", label_fr: "Plateau veggie", label_en: "Veggie platter", quantity: 1 }, { category_key: "boissons-event", label_fr: "Boissons", label_en: "Drinks", quantity: 2 }] },
      { key: "training-day", name_fr: "Journee formation", name_en: "Training day", description_fr: "Petit dej + midi + pauses.", description_en: "Breakfast + lunch + breaks.", price: 189, display_order: 2, slots: [{ category_key: "petit-dej-corp", label_fr: "Petit dej", label_en: "Breakfast", quantity: 1 }, { category_key: "plats-chauds", label_fr: "Plats", label_en: "Mains", quantity: 1 }, { category_key: "desserts-bureau", label_fr: "Desserts", label_en: "Desserts", quantity: 1 }] },
      { key: "seminar-pack", name_fr: "Pack seminaire", name_en: "Seminar pack", description_fr: "Package premium pour seminaire.", description_en: "Premium package for seminars.", price: 265, display_order: 3, slots: [{ category_key: "packs-seminaire", label_fr: "Pack", label_en: "Pack", quantity: 1 }, { category_key: "mini-bocaux", label_fr: "Mini bocaux", label_en: "Mini jars", quantity: 2 }, { category_key: "boissons-event", label_fr: "Boissons", label_en: "Drinks", quantity: 2 }] },
    ],
  }),
  buildShopBlueprint({
    key: "healthy-sport",
    audience: { fr: "les clients bien-etre et performance sportive", en: "wellness and sport performance customers" },
    owner: { email: "owner.healthy.sport@bento.local", password: "BentoLocal-2026-06!", full_name: "Ines Renaud" },
    shop_name_fr: "Fuel & Flow Kitchen",
    shop_name_en: "Fuel & Flow Kitchen",
    shop_description_fr: "Cuisine healthy orientee objectifs nutritionnels.",
    shop_description_en: "Healthy kitchen focused on nutrition goals.",
    shop_type: "other",
    storefront_theme_key: "emerald",
    fulfillment_modes: ["takeaway", "delivery", "dine_in"],
    bundles_menu_grouped: true,
    categories: [
      { key: "power-bowls", name_fr: "Power bowls", name_en: "Power bowls", description_fr: "Bowls macro-equilibres.", description_en: "Macro-balanced bowls.", pitch_fr: "Macros lisibles et portions controlees.", pitch_en: "Clear macros and controlled portions.", icon_emoji: "🥗", base_price: 11.9, tagHint: "bestseller", allergenHint: "nuts", glutenFreeFriendly: true },
      { key: "lean-proteins", name_fr: "Lean proteins", name_en: "Lean proteins", description_fr: "Proteines maigres haute qualite.", description_en: "High-quality lean proteins.", pitch_fr: "Objectif recuperation musculaire.", pitch_en: "Built for muscle recovery.", icon_emoji: "🍗", base_price: 12.8, tagHint: "halal", allergenHint: "soybeans" },
      { key: "vegan-performance", name_fr: "Vegan performance", name_en: "Vegan performance", description_fr: "Options 100% vegetales performantes.", description_en: "High-performance plant-based options.", pitch_fr: "Densite nutritionnelle elevee sans animal.", pitch_en: "High nutrient density without animal products.", icon_emoji: "🌱", base_price: 10.7, tagHint: "vegan", allergenHint: "sesame", veganFriendly: true, glutenFreeFriendly: true },
      { key: "smart-carbs", name_fr: "Smart carbs", name_en: "Smart carbs", description_fr: "Glucides complexes pre/post effort.", description_en: "Complex carbs for pre/post training.", pitch_fr: "Energie diffusee sans crash.", pitch_en: "Steady energy release without crash.", icon_emoji: "🍠", base_price: 7.8, tagHint: "organic", allergenHint: "gluten" },
      { key: "smoothies", name_fr: "Smoothies", name_en: "Smoothies", description_fr: "Blends fonctionnels hydratants.", description_en: "Hydrating functional blends.", pitch_fr: "Hydratation + micronutriments.", pitch_en: "Hydration plus micronutrients.", icon_emoji: "🥤", base_price: 6.3, tagHint: "new", allergenHint: "milk", veganFriendly: true, glutenFreeFriendly: true },
      { key: "snacks-clean", name_fr: "Clean snacks", name_en: "Clean snacks", description_fr: "Collations propres et pratiques.", description_en: "Clean and practical snacks.", pitch_fr: "En-cas faible transformation.", pitch_en: "Low-processed snack options.", icon_emoji: "🥜", base_price: 4.6, tagHint: "gluten_free", allergenHint: "nuts", veganFriendly: true, glutenFreeFriendly: true },
      { key: "desserts-fit", name_fr: "Desserts fit", name_en: "Fit desserts", description_fr: "Desserts proteines et sucres maitrises.", description_en: "Protein desserts with controlled sugars.", pitch_fr: "Plaisir sans sortir du cadre.", pitch_en: "Enjoyment without breaking your plan.", icon_emoji: "🍨", base_price: 5.4, tagHint: "new", allergenHint: "milk", glutenFreeFriendly: true },
      { key: "goal-combos", name_fr: "Goal combos", name_en: "Goal combos", description_fr: "Combos selon objectif nutritionnel.", description_en: "Combos tailored by nutrition goals.", pitch_fr: "Selection rapide selon cible.", pitch_en: "Fast selection by target outcome.", icon_emoji: "🎯", base_price: 16.5, tagHint: "bestseller", allergenHint: "soybeans" },
    ],
    bundles: [
      { key: "cut-phase", name_fr: "Cut phase", name_en: "Cut phase", description_fr: "Combo hypocalorique haute satiété.", description_en: "Low-calorie high-satiety combo.", price: 17.2, display_order: 1, slots: [{ category_key: "power-bowls", label_fr: "Bowl", label_en: "Bowl", quantity: 1 }, { category_key: "smoothies", label_fr: "Smoothie", label_en: "Smoothie", quantity: 1 }, { category_key: "snacks-clean", label_fr: "Snack", label_en: "Snack", quantity: 1 }] },
      { key: "bulk-phase", name_fr: "Bulk phase", name_en: "Bulk phase", description_fr: "Combo prise de masse propre.", description_en: "Clean muscle gain combo.", price: 21.4, display_order: 2, slots: [{ category_key: "lean-proteins", label_fr: "Proteine", label_en: "Protein", quantity: 1 }, { category_key: "smart-carbs", label_fr: "Carbs", label_en: "Carbs", quantity: 1 }, { category_key: "desserts-fit", label_fr: "Dessert", label_en: "Dessert", quantity: 1 }] },
      { key: "vegan-flow", name_fr: "Vegan flow", name_en: "Vegan flow", description_fr: "Pack vegetal complet.", description_en: "Full plant-based pack.", price: 19.6, display_order: 3, slots: [{ category_key: "vegan-performance", label_fr: "Base vegan", label_en: "Vegan base", quantity: 1 }, { category_key: "smoothies", label_fr: "Boisson", label_en: "Drink", quantity: 1 }, { category_key: "snacks-clean", label_fr: "Snack", label_en: "Snack", quantity: 1 }] },
    ],
  }),
];

