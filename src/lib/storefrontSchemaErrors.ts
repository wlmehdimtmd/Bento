/** Détecte une erreur PostgREST / schéma liée aux colonnes vitrine `shops`. */
export function isMissingStorefrontLayoutColumn(message: string) {
  return /storefront_bento_layout|storefront_theme_key|storefront_theme_overrides|schema cache/i.test(
    message
  );
}

/** Erreur PostgREST / Postgres liée au refus RLS sur `shops` (update, etc.). */
export function isShopRowLevelSecurityDenied(message: string) {
  return /row-level security|violates row-level security|permission denied for table|42501/i.test(
    message
  );
}

export function formatLayoutSaveError(message: string): string {
  if (isShopRowLevelSecurityDenied(message)) {
    return "Enregistrement refusé par la base (règles de sécurité). Vérifiez que vous êtes connecté avec le compte propriétaire de cette boutique, puis rechargez la page.";
  }
  if (isMissingStorefrontLayoutColumn(message)) {
    return "Une colonne vitrine requise (« storefront_bento_layout », « storefront_theme_key » ou « storefront_theme_overrides ») n’existe pas encore sur la table « shops ». Exécutez les migrations SQL de vitrine, attendez ~1 minute (cache schéma), puis réessayez.";
  }
  return message;
}

/** Lien vers l’éditeur SQL du projet (dérivé de NEXT_PUBLIC_SUPABASE_URL). */
export function getSupabaseSqlEditorUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    if (host.includes("localhost")) return null;
    const projectRef = host.split(".")[0];
    if (!projectRef) return null;
    return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  } catch {
    return null;
  }
}
