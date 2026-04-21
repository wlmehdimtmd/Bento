/**
 * Zone scrollable des formulaires catalogue en drawer mobile.
 * `min-h-0` + `flex-1` : indispensable pour que le flex enfant puisse rétrécir et que
 * `overflow-y-auto` s’active quand le contenu dépasse (ex. composition formule).
 * `max-h` : filet de sécurité si la chaîne flex ne borne pas la hauteur.
 */
export const mobileCatalogDrawerScrollClass =
  "min-h-0 flex-1 max-h-[calc(92dvh-10.5rem)] overflow-y-auto overscroll-y-contain";

/** Sheet catalogue (pleine hauteur) : le flex borne la hauteur, pas de plafond `dvh`. */
export const catalogSheetScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain";
