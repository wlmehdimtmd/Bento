# Backlog produit / technique

## Commandes `pending` non payées (spam / DDoS)

Les commandes vitrine sont créées via **`POST /api/orders/create`** (service role + validation catalogue) avant redirection Stripe. Aucun job ou cron ne purge les `orders` restées `pending` indéfiniment (seul `src/app/api/cron/refresh-reviews/route.ts` existe pour les avis).

**Pistes ultérieures :** nettoyage planifié (ex. annuler/supprimer les `pending` sans `stripe_checkout_session_id` au-delà de N heures), **rate-limit sur `POST /api/orders/create`** (PR suivant), captcha.

## Rate limit `POST /api/orders/create`

À traiter dans un PR ultérieur (Upstash ou équivalent), aligné sur les autres routes sensibles.
