# Tests Stripe Checkout en local (Bento Resto)

Procédure **auto-suffisante** pour valider le flux paiement de bout en bout après clonage du dépôt : Next.js en local, Stripe en **mode test**, webhooks via **Stripe CLI**.

---

## 1. Prérequis

- **Compte Stripe** avec accès au [Dashboard](https://dashboard.stripe.com) (mode **Test** activé).
- **Stripe CLI** installée. Vérification :

  ```bash
  stripe --version
  ```

- Fichier **`.env.local`** à la racine du projet (non versionné), avec au minimum :

  | Variable | Exemple / rôle |
  |----------|----------------|
  | `STRIPE_SECRET_KEY` | `sk_test_...` — clé secrète **test** (Dashboard → Developers → API keys) |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` — clé publique **test** |
  | `STRIPE_WEBHOOK_SECRET` | `whsec_...` — fourni par `stripe listen` (voir §3) |
  | `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` — URL canonique pour `success_url` / liens |
  | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon |
  | `SUPABASE_SERVICE_ROLE_KEY` | Rôle service (routes API checkout / webhook, page succès) |

Sans **`SUPABASE_SERVICE_ROLE_KEY`**, le webhook et la liaison commande ↔ session échoueront.

---

## 2. Installation et login

### macOS

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

Voir la [documentation officielle Stripe CLI](https://stripe.com/docs/stripe-cli#install) (paquets `.deb` / `.rpm` ou binaire).

### Windows

Même lien : [installer Stripe CLI](https://stripe.com/docs/stripe-cli#install) (`.msi` ou Scoop).

### Authentification

```bash
stripe login
```

Une page navigateur s’ouvre : autoriser le CLI à accéder à ton compte Stripe (compte de **test** recommandé pour le développement).

---

## 3. Lancer le forwarding des webhooks

Dans un **second terminal** (le premier sert à `npm run dev`) :

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

La commande affiche une ligne du type :

```text
Ready! You are using Stripe API Version ... Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

1. Copier la valeur **`whsec_...`**.
2. La coller dans **`.env.local`** comme **`STRIPE_WEBHOOK_SECRET=whsec_...`**.
3. **Redémarrer** le serveur Next (`Ctrl+C` puis `npm run dev`) pour recharger les variables d’environnement.

> **Note :** le secret `whsec_` change si tu relances `stripe listen` dans certains cas ; mets à jour `.env.local` et redémarre Next si la signature webhook échoue.

---

## 4. Procédure de test complète

1. **Terminal 1 — Next.js**

   ```bash
   npm run dev
   ```

2. **Terminal 2 — Stripe listen** (commande du §3, avec le bon `whsec_` dans `.env.local`).

3. Ouvrir une **boutique réelle** du projet (données Supabase test), par exemple :

   `http://localhost:3000/<slug-de-ta-boutique>`

   Utiliser une boutique **active** avec produits et Stripe configuré côté marchand si besoin.

4. **Ajouter un produit** (ou une formule) au panier.

5. Ouvrir le **panier** puis le **checkout**, remplir les champs requis (nom, mode de retrait, etc.).

6. Soumettre : redirection vers **Stripe Checkout** (hébergé par Stripe).

7. **Carte de test** (paiement réussi) :

   - Numéro : **4242 4242 4242 4242**
   - Date d’expiration : **n’importe quelle date future**
   - CVC : **3 chiffres** (ex. `123`)
   - Code postal si demandé : ex. `75001`

8. Valider le paiement. Stripe redirige vers une URL du type :

   `http://localhost:3000/<slug>?order=success&session_id=cs_test_...`

9. **Vérifications côté UI**

   - Page de **confirmation** (récap : n° de commande, client, mode, lignes, total).
   - Si le webhook est **légèrement en retard**, message du type **« Paiement reçu, confirmation en cours… »** avec rafraîchissement automatique puis passage au récap complet une fois `orders.status = confirmed`.

---

## 5. Checklist de vérification

- [ ] Dans le terminal **`stripe listen`** : événement **`checkout.session.completed`** reçu, réponse **HTTP 200** depuis ton app.
- [ ] **Page succès** : récap complet affiché (pas uniquement la vitrine catalogue).
- [ ] **Supabase** (table `orders`) pour la commande concernée :
  - [ ] `status` = **`confirmed`**
  - [ ] `paid_at` renseigné
  - [ ] `stripe_checkout_session_id` = l’id `cs_test_...` de la session
  - [ ] `stripe_payment_intent_id` / `stripe_payment_status` cohérents avec le webhook
- [ ] **Test « webhook en retard »** : couper temporairement `stripe listen` ou mettre un `STRIPE_WEBHOOK_SECRET` invalide, refaire un paiement : la page doit afficher l’état intermédiaire **« Paiement reçu, confirmation en cours… »** et le **rafraîchissement** (puis corriger le secret et réécouter).

---

## 6. Cartes de test utiles

| Cas | Numéro |
|-----|--------|
| Paiement OK | `4242 4242 4242 4242` |
| Refusé (fonds insuffisants) | `4000 0000 0000 9995` |
| Refusé (decline générique) | `4000 0000 0000 0002` |
| 3D Secure requis | `4000 0025 0000 3155` |

Liste complète : [Testing](https://stripe.com/docs/testing) (Stripe).

---

## 7. Dépannage (troubleshooting)

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| **`Invalid signature`** dans les logs serveur / webhook 400 | `STRIPE_WEBHOOK_SECRET` ne correspond pas au `stripe listen` en cours | Copier à nouveau le `whsec_` affiché, mettre à jour `.env.local`, **redémarrer** `npm run dev`. |
| Après paiement, **retour sur la vitrine** sans récap | `session_id` absent ou invalide, ou `sessions.retrieve` / garde-fous échouent | Vérifier l’URL (`order=success&session_id=cs_test_...`), les logs serveur (`[checkout-success]`). |
| **409** `Order state conflict` sur `/api/stripe/create-checkout` | La commande n’est plus en **`pending`** (déjà liée ou déjà traitée) | Repartir d’un **nouveau panier** (nouvelle commande `pending`). |
| Webhook **401 / 403** ou silence | Secret manquant, faux, ou route incorrecte | Vérifier `STRIPE_WEBHOOK_SECRET`, l’URL exacte **`/api/stripe/webhook`** (pas `/api/webhooks/stripe`). |
| Checkout ne démarre pas | `SUPABASE_SERVICE_ROLE_KEY` ou clés Stripe manquantes | Vérifier `.env.local` et redémarrer Next. |

---

## 8. Note production (Vercel)

- Le **signing secret** webhook en **production** provient du **Stripe Dashboard** : **Developers → Webhooks** → sélectionner l’endpoint de prod → **Signing secret** (`whsec_...` **différent** du local).
- Déclarer cette valeur dans **Vercel** (ou autre hébergeur) : variable **`STRIPE_WEBHOOK_SECRET`** d’environnement **production**.
- **URL de l’endpoint** à enregistrer dans Stripe pour la prod :

  `https://<ton-domaine>/api/stripe/webhook`

- Les clés **`sk_live_` / `pk_live_`** et le secret webhook **prod** ne doivent **jamais** être commités ; uniquement dans les variables d’environnement du déploiement.

---

## Références rapides dans le repo

| Élément | Chemin |
|---------|--------|
| Création session Checkout | `src/lib/stripe/server.ts` |
| API création session + liaison `stripe_checkout_session_id` | `src/app/api/stripe/create-checkout/route.ts` |
| Webhook `checkout.session.completed` | `src/app/api/stripe/webhook/route.ts` |
| Page succès vitrine | `src/app/(public)/[slug]/page.tsx` + `src/lib/checkout/loadCheckoutSuccessPayload.ts` |
