# Audit Bento Resto — journal des décisions

Ce fichier trace les **décisions structurantes** et l’avancement de l’audit méthodique (une grande partie du produit à la fois). Les rapports détaillés (inventaire, code mort, hardcodes) sont produits dans la conversation associée à chaque étape.

## Méthodologie

1. Inventaire → code mort → doublons → données en dur → structure → synthèse priorisée.
2. **Aucune étape suivante** (Landing, Dashboard, Vitrine, etc.) sans validation explicite du porteur.
3. Les changements de code proposés sont **soumis à validation** avant application (PR / commit).

## Avancement

| Partie            | Statut audit | Notes |
|-------------------|--------------|-------|
| Authentification  | Rapport + correctifs ciblés | AuthGuard retiré ; erreurs callback login ; etc. |
| Landing Page      | Rapport initial livré | Conversation du 2026-04-21 |
| Dashboard Client  | Rapport initial livré | Conversation du 2026-04-21 |
| Vitrine Client    | Rapport initial livré | Conversation du 2026-04-21 |

## Journal des décisions

| Date       | Partie | Décision / constat | Statut |
|------------|--------|--------------------|--------|
| 2026-04-21 | Auth   | L’audit Auth est traité en premier ; aucune modification applicative n’a été fusionnée sans validation utilisateur. | Fait (rapport) |
| 2026-04-21 | Auth   | `AuthGuard.tsx` supprimé : la garde session est déjà dans `dashboard/layout.tsx`. | Fait |
| 2026-04-21 | Auth   | `SUPABASE_REDIRECT_RELATIVE_PATHS` est exporté mais jamais importé : candidat suppression ou usage documenté (README interne). | À décider |
| 2026-04-21 | Auth   | Les redirections `/login?error=…` : messages affichés sur la page login (FR/EN). | Fait |
| 2026-04-21 | Landing | Texte i18n **multi-boutiques** (`landing.features.multishop.*`) en contradiction avec la règle métier **mono-boutique** (`CLAUDE.md`) : à aligner (copy ou produit). | À décider |
| 2026-04-21 | Landing | Clé `landing.footer.rights` définie dans `i18nMessages.ts` mais non utilisée dans le footer de `LandingPageClient`. | Nice to have |
| 2026-04-21 | Repo   | Journal `AUDIT.md` initial commité (`docs: ajout du journal d'audit`). | Fait |
| 2026-04-21 | Dashboard | **`/dashboard/page`** : le CA (« revenue ») est calculé avec `reduce` sur les **mêmes** lignes que la liste « 5 dernières commandes » (`.limit(5)`) — le chiffre affiché n’est pas le CA total de la boutique. | **Bug métier** — à corriger |
| 2026-04-21 | Dashboard | Double familles d’URLs catalogue : `/dashboard/categories` (shop implicite) vs `/dashboard/shops/[shopId]/categories` — même contenu, navigation selon contexte. | Dette / complexité acceptable si voulu ; sinon simplifier |
| 2026-04-21 | Dashboard | i18n : nombreuses chaînes via `tr(fr, en)` (cookies + `LocaleProvider`) en parallèle de `i18nMessages` / `getDashboardCatalogCopy`. | Refactor progressif possible |
| 2026-04-21 | Dashboard | `DashboardSidebar` reçoit `user` mais ne l’utilise pas (`_user`). | Nettoyage API props possible |
| 2026-04-21 | Dashboard | `StatsCard` : `toLocaleString("fr-FR")` pour les compteurs même si `locale === "en"`. | Cosmétique i18n |
| 2026-04-21 | Vitrine | Chaîne FR vide carte : `n&apos;a` dans une string JS affichait l’entité HTML en clair — corrigé en `n'a`. | Corrigé (code) |
| 2026-04-21 | Vitrine | `fetchPublicShopPagePayload` : plusieurs `select` successifs sur `shops` (layout, theme, bundles_grouped…) — candidat fusion en un select ou vue. | Perf / clarté |
| 2026-04-21 | Vitrine | `CheckoutForm` : `FULFILLMENT_LABELS` local duplique partiellement `FULFILLMENT_MODES` dans `constants.ts`. | DRY possible |
| 2026-04-21 | Vitrine | Métadonnées `alternates.canonical` utilisent le `slug` d’URL, pas forcément le slug canonique boutique si jamais redirection slug. | À surveiller |

---

*Dernière mise à jour : 2026-04-21*
