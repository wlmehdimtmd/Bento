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
| Landing Page      | Rapport + correctifs (copy mono-boutique, footer) | — |
| Dashboard Client  | Rapport + correctifs (CA, i18n, erreur, sidebar) | — |
| Vitrine Client    | Rapport + correctifs (select shops, checkout, i18n vide) | — |

## Journal des décisions

| Date       | Partie | Décision / constat | Statut |
|------------|--------|--------------------|--------|
| 2026-04-21 | Auth   | L’audit Auth est traité en premier ; aucune modification applicative n’a été fusionnée sans validation utilisateur. | Fait (rapport) |
| 2026-04-21 | Auth   | `AuthGuard.tsx` supprimé : la garde session est déjà dans `dashboard/layout.tsx`. | Fait |
| 2026-04-21 | Auth   | `SUPABASE_REDIRECT_RELATIVE_PATHS` supprimé ; doc conservée en commentaire dans `authRedirectUrls.ts`. | Fait |
| 2026-04-21 | Auth   | Les redirections `/login?error=…` : messages affichés sur la page login (FR/EN). | Fait |
| 2026-04-21 | Landing | Copy **mono-boutique** pour `landing.features.multishop.*` ; `landing.footer.rights` affiché dans le footer. | Fait |
| 2026-04-21 | Repo   | Journal `AUDIT.md` initial commité (`docs: ajout du journal d'audit`). | Fait |
| 2026-04-21 | Dashboard | CA dashboard : somme sur toutes les commandes non annulées (requête dédiée). | Fait |
| 2026-04-21 | Dashboard | Routes catalogue canoniques : `/dashboard/shops/[shopId]/…` ; anciennes URL `/dashboard/categories` etc. redirigent. | Fait |
| 2026-04-21 | Dashboard | i18n : nombreuses chaînes via `tr(fr, en)` (cookies + `LocaleProvider`) en parallèle de `i18nMessages` / `getDashboardCatalogCopy`. | Refactor progressif possible |
| 2026-04-21 | Dashboard | Props `user` inutilisées retirées (sidebar + layout) ; requête `users.full_name` supprimée du layout. | Fait |
| 2026-04-21 | Dashboard | `StatsCard` / `RecentOrders` / `error.tsx` : format nombre et libellés selon locale. | Fait |
| 2026-04-21 | Vitrine | Chaîne FR vide carte : `n&apos;a` dans une string JS affichait l’entité HTML en clair — corrigé en `n'a`. | Corrigé (code) |
| 2026-04-21 | Vitrine | `fetchPublicShopPagePayload` : un seul `select` shops (layout + thème + bundles groupés). | Fait |
| 2026-04-21 | Vitrine | Checkout : libellés modes depuis `FULFILLMENT_MODES` + `labelEn`. | Fait |
| 2026-04-21 | Auth/API | Validation Zod register, schéma MDP partagé, `getAuthRequestMeta` (login, register, logout, callback). | Fait |
| 2026-04-21 | Cart | Bloc no-op retiré dans `cartStore.addItem`. | Fait |
| 2026-04-21 | Vitrine | `alternates.canonical` sur `/{slug}` : pas de changement code ; **surveillance** recommandée dans **Google Search Console** (couverture, canonicals, slug canonique vs URL saisie). | Surveillance GSC |
| 2026-04-21 | Landing | `formatPrice` unifié (`utils`) + options décimales pour le hero démo (`fetchLandingDemoHero`). | Fait |

---

*Dernière mise à jour : 2026-04-21*
