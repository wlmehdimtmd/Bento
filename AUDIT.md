# Audit Bento Resto — journal des décisions

Ce fichier trace les **décisions structurantes** et l’avancement de l’audit méthodique (une grande partie du produit à la fois). Les rapports détaillés (inventaire, code mort, hardcodes) sont produits dans la conversation associée à chaque étape.

## Méthodologie

1. Inventaire → code mort → doublons → données en dur → structure → synthèse priorisée.
2. **Aucune étape suivante** (Landing, Dashboard, Vitrine, etc.) sans validation explicite du porteur.
3. Les changements de code proposés sont **soumis à validation** avant application (PR / commit).

## Avancement

| Partie            | Statut audit | Notes |
|-------------------|--------------|-------|
| Authentification  | En cours     | Rapport initial : conversation du 2026-04-21 |
| Landing Page      | Non démarré  |       |
| Dashboard Client  | Non démarré  |       |
| Vitrine Client    | Non démarré  |       |

## Journal des décisions

| Date       | Partie | Décision / constat | Statut |
|------------|--------|--------------------|--------|
| 2026-04-21 | Auth   | L’audit Auth est traité en premier ; aucune modification applicative n’a été fusionnée sans validation utilisateur. | En attente validation |
| 2026-04-21 | Auth   | `AuthGuard.tsx` n’est référencé par aucun module applicatif (seulement la doc `CLAUDE.md`) : candidat **code mort** ou réutilisation future — à trancher. | À décider |
| 2026-04-21 | Auth   | `SUPABASE_REDIRECT_RELATIVE_PATHS` est exporté mais jamais importé : candidat suppression ou usage documenté (README interne). | À décider |
| 2026-04-21 | Auth   | Les redirections `/login?error=…` émises par `api/auth/callback` ne sont pas consommées par la page login : **écart UX** à corriger ou documenter. | À décider |

---

*Dernière mise à jour : 2026-04-21*
