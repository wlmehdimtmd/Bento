/**
 * Zone scrollable des formulaires catalogue en drawer mobile.
 * `min-h-0` + `flex-1` : indispensable pour que le flex enfant puisse rétrécir et que
 * `overflow-y-auto` s’active quand le contenu dépasse (ex. composition formule).
 * Les drawers mobile sont en `100dvh`, donc on évite tout plafond `max-h` qui
 * créerait un vide sous les CTA.
 */
export const mobileCatalogDrawerScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";

/** Sheet catalogue (pleine hauteur) : le flex borne la hauteur, pas de plafond `dvh`. */
export const catalogSheetScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";
