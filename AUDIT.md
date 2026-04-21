# Audit Bento Resto — journal des décisions

Ce fichier trace les **décisions structurantes** et l’avancement de l’audit méthodique (une grande partie du produit à la fois). Les rapports détaillés (inventaire, code mort, hardcodes) sont produits dans la conversation associée à chaque étape.

## Méthodologie

1. Inventaire → code mort → doublons → données en dur → structure → synthèse priorisée.
2. **Aucune étape suivante** (Landing, Dashboard, Vitrine, etc.) sans validation explicite du porteur.
3. Les changements de code proposés sont **soumis à validation** avant application (PR / commit).

## Avancement

| Partie            | Statut audit | Notes |
|-------------------|--------------|-------|
| Authentification  | Rapport initial livré | Pas de correctif code mergé ; sujets ouverts (AuthGuard, `?error=`, etc.). |
| Landing Page      | Rapport initial livré | Conversation du 2026-04-21 |
| Dashboard Client  | Rapport initial livré | Conversation du 2026-04-21 |
| Vitrine Client    | Non démarré  | Prochaine étape après validation |

## Journal des décisions

| Date       | Partie | Décision / constat | Statut |
|------------|--------|--------------------|--------|
| 2026-04-21 | Auth   | L’audit Auth est traité en premier ; aucune modification applicative n’a été fusionnée sans validation utilisateur. | Fait (rapport) |
| 2026-04-21 | Auth   | `AuthGuard.tsx` n’est référencé par aucun module applicatif (seulement la doc `CLAUDE.md`) : candidat **code mort** ou réutilisation future — à trancher. | À décider |
| 2026-04-21 | Auth   | `SUPABASE_REDIRECT_RELATIVE_PATHS` est exporté mais jamais importé : candidat suppression ou usage documenté (README interne). | À décider |
| 2026-04-21 | Auth   | Les redirections `/login?error=…` émises par `api/auth/callback` ne sont pas consommées par la page login : **écart UX** à corriger ou documenter. | À décider |
| 2026-04-21 | Landing | Texte i18n **multi-boutiques** (`landing.features.multishop.*`) en contradiction avec la règle métier **mono-boutique** (`CLAUDE.md`) : à aligner (copy ou produit). | À décider |
| 2026-04-21 | Landing | Clé `landing.footer.rights` définie dans `i18nMessages.ts` mais non utilisée dans le footer de `LandingPageClient`. | Nice to have |
| 2026-04-21 | Repo   | Journal `AUDIT.md` initial commité (`docs: ajout du journal d'audit`). | Fait |
| 2026-04-21 | Dashboard | **`/dashboard/page`** : le CA (« revenue ») est calculé avec `reduce` sur les **mêmes** lignes que la liste « 5 dernières commandes » (`.limit(5)`) — le chiffre affiché n’est pas le CA total de la boutique. | **Bug métier** — à corriger |
| 2026-04-21 | Dashboard | Double familles d’URLs catalogue : `/dashboard/categories` (shop implicite) vs `/dashboard/shops/[shopId]/categories` — même contenu, navigation selon contexte. | Dette / complexité acceptable si voulu ; sinon simplifier |
| 2026-04-21 | Dashboard | i18n : nombreuses chaînes via `tr(fr, en)` (cookies + `LocaleProvider`) en parallèle de `i18nMessages` / `getDashboardCatalogCopy`. | Refactor progressif possible |
| 2026-04-21 | Dashboard | `DashboardSidebar` reçoit `user` mais ne l’utilise pas (`_user`). | Nettoyage API props possible |
| 2026-04-21 | Dashboard | `StatsCard` : `toLocaleString("fr-FR")` pour les compteurs même si `locale === "en"`. | Cosmétique i18n |

---

*Dernière mise à jour : 2026-04-21*
