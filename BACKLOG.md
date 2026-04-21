# Backlog produit / technique

## Commandes `pending` non payées (spam / DDoS)

Les commandes sont créées côté client anonyme avant redirection Stripe (`CheckoutForm` → policy INSERT publique). Aucun job ou cron ne purge les `orders` restées `pending` indéfiniment (seul `src/app/api/cron/refresh-reviews/route.ts` existe pour les avis).

**Pistes ultérieures :** nettoyage planifié (ex. annuler/supprimer les `pending` sans `stripe_checkout_session_id` au-delà de N heures), rate-limit sur création de commande, captcha, ou création de commande déplacée côté serveur avec garde-fous.
