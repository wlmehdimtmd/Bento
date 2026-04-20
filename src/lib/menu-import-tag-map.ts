/** Mappe les libellés renvoyés par l’IA vers les valeurs `ALLERGENS` / `LABELS` quand c’est possible. */
const AI_TAG_TO_DB: Record<string, string> = {
  végétarien: "vegetarian",
  vegetarien: "vegetarian",
  vegan: "vegan",
  poisson: "fish",
  "fruits à coque": "nuts",
  "fruits a coque": "nuts",
  gluten: "gluten",
  épicé: "spicy",
  epice: "spicy",
  bio: "organic",
  "fait maison": "homemade",
  "sans lactose": "sans_lactose",
};

export function normalizeTagsForDb(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const k = raw
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    const v = AI_TAG_TO_DB[k] ?? raw.trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

export const MENU_IMPORT_TAG_OPTIONS: { value: string; label: string }[] = [
  { value: "vegetarian", label: "Végétarien" },
  { value: "vegan", label: "Vegan" },
  { value: "fish", label: "Poisson" },
  { value: "nuts", label: "Fruits à coque" },
  { value: "gluten", label: "Gluten" },
  { value: "spicy", label: "Épicé" },
  { value: "organic", label: "Bio" },
  { value: "homemade", label: "Fait maison" },
  { value: "sans_lactose", label: "Sans lactose" },
];
