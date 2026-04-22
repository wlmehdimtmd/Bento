@AGENTS.md

# CLAUDE.md — Bento Resto

## 1. Identité du projet

**Bento Resto** — SaaS B2B2C de vitrine digitale et prise de commande en ligne.
- Cible : tout commerce avec une grille tarifaire
- Le commerçant crée un compte, configure sa boutique via un back-office, obtient une vitrine publique en format "Bento" (grille compartimentée japonisante) accessible via URL unique ou QR code
- Les clients consultent, ajoutent au panier et paient via Stripe

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js App Router — TypeScript strict | 14 |
| UI | Tailwind CSS + shadcn/ui | v4 |
| Animations | Framer Motion | — |
| State | Zustand (panier + UI) | — |
| Theme | next-themes (light/dark) | — |
| Backend | Supabase (Auth, PostgreSQL, Storage, Realtime) | — |
| Paiement | Stripe Checkout + Webhooks | — |
| QR Code | qrcode.react | — |
| Fonts | Inter (body) + Onest (titres) via next/font/google | — |
| Deploy | Vercel | — |
| Node | v18+ | — |

---

## 3. Design system & règles visuelles

- **Fonts** : Inter (body), Onest (h1–h4 et tout élément titre)
- **Light** : fond `#faf9f6`, texte `#1a1a1a`, accent vitrine global `#376cd5` (CTA / liens / focus)
- **Dark** : fond `#1a1a1a`, texte `#faf9f6`, accent vitrine global `#6fa0ff`
- **Vitrine** : boutons primaires restent **monochromes** (noir / blanc) — variables `--primary`, pas l’accent bleu
- **Contraste** : WCAG AA minimum partout
- **Style** : minimaliste, japonisant, compartimenté, whitespace généreux
- **Border-radius** : `rounded-2xl` sur les cartes bento
- **Toasts** : shadcn Sonner — **TOUJOURS `position="top-center"`** — jamais en bas (le pouce navigue en bas sur mobile → clics accidentels sur "Commander")
- **Responsive** : mobile-first — 1 col mobile, 2 col tablette, 3 col desktop
- **Thèmes (light / dark)** : toute consigne ou modification **UI** implique une vérification dans **les deux** modes (lisibilité, contrastes, bordures, fonds, overlays, médias). Ne pas valider sur un seul thème.
- **i18n** : l’interface est **multilingue** — tout libellé utilisateur nouveau doit être traduit pour **chaque** locale supportée (`src/lib/i18nMessages.ts`, `useLocale().t()`, ou schéma équivalent côté serveur). Éviter les chaînes en dur dans les composants pour du texte affiché ; aligner les clés entre locales (contrôle possible via `src/scripts/checkI18nCoverage.ts`).

---

## 4. Architecture & structure de fichiers

```
src/
├── app/
│   ├── layout.tsx               # Layout racine (fonts, providers, Toaster)
│   ├── page.tsx                 # Landing page SaaS
│   ├── demo/page.tsx            # Vitrine démo "Maison Kanpai" (données statiques)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (public)/
│   │   └── [slug]/
│   │       ├── page.tsx         # Vitrine Bento publique d'une boutique
│   │       └── layout.tsx
│   ├── dashboard/
│   │   ├── layout.tsx           # Layout dashboard (sidebar + session)
│   │   ├── page.tsx             # Tableau de bord
│   │   ├── shops/[shopId]/     # CRUD catalogue & vitrine (routes canoniques)
│   │   ├── categories/page.tsx  # → redirect /dashboard/shops/[id]/categories
│   │   ├── products/page.tsx    # idem …/products
│   │   ├── bundles/page.tsx     # idem …/bundles
│   │   ├── orders/page.tsx      # idem …/orders
│   │   └── settings/page.tsx
│   └── api/
│       ├── stripe/
│       │   ├── create-checkout/route.ts
│       │   └── webhook/route.ts
│       └── qrcode/[slug]/route.ts
├── components/
│   ├── ui/                      # shadcn/ui — NE PAS modifier manuellement
│   ├── layout/                  # AppShell, Sidebar, Header, Footer, ThemeToggle
│   ├── auth/                    # LoginForm, RegisterForm, ResetPasswordForm…
│   ├── bento/                   # BentoGrid, BentoCard, BentoCardCategory…
│   ├── product/                 # CategoryForm, ProductForm, BundleForm…
│   ├── cart/                    # CartDrawer, CartItem, CartSummary, CartButton
│   ├── checkout/                # CheckoutForm, OrderConfirmation
│   ├── order/                   # OrderCard, OrderList, OrderDetail
│   ├── shop/                    # ShopForm, ShopCard, QRCodeDisplay
│   └── dashboard/               # StatsCard, QuickActions, RecentOrders
├── lib/
│   ├── stores/
│   │   └── cartStore.ts         # Zustand — panier (items, quantités, total)
│   ├── supabase/
│   │   ├── client.ts            # createBrowserClient
│   │   ├── server.ts            # createServerClient
│   │   └── middleware.ts        # Auth middleware
│   ├── stripe/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── types.ts                 # Types globaux (Shop, Category, Product…)
│   ├── constants.ts             # Constantes (allergènes, modes commande…)
│   └── utils.ts                 # Helpers (formatPrice, cn, slugify…)
```

---

## 5. Modèle de données Supabase

```
users
└── shops          (1 user → 1 shop UNIQUEMENT — contrainte mono-boutique)
      ├── categories      (1 shop → N categories)
      │     └── products  (1 category → N products)
      ├── bundles         (1 shop → N bundles)
      │     └── bundle_slots (1 bundle → N slots → 1 category chacun)
      └── orders          (1 shop → N orders)
            └── order_items (1 order → N items → 1 product ou 1 bundle)
```

**RLS critique :**
- Commerçant : CRUD uniquement sur SES données (`auth.uid() = user_id du shop`)
- Public : `SELECT` sur `shops`, `categories`, `products` (vitrine publique, sans auth)
- Storage buckets : `shop-assets` (logo, cover) et `product-images`

---

## 6. Règles métier

- **Mono-boutique** : 1 user = 1 shop max — bloquer toute création d'une 2e boutique côté API et UI
- **Vitrine publique** : accessible sans auth via `/[slug]` — RLS public activée
- **Checkout** : passe par Stripe Checkout — ne jamais stocker les données CB
- **Demo** : `/demo` affiche "Maison Kanpai" avec données statiques ; le checkout est bloqué (toast informatif, pas d'erreur)
- **QR code** : généré server-side via `/api/qrcode/[slug]` et téléchargeable

---

## 7. Conventions de code

- **TypeScript strict** — aucun `any` sauf cas exceptionnel documenté en commentaire
- Composants React : function components — arrow functions OK
- Nommage fichiers composants : `PascalCase.tsx`
- Nommage fichiers utilitaires : `camelCase.ts`
- Imports : alias `@/` pour `src/`
- **Styles** : Tailwind uniquement — pas de CSS modules ni styled-components
- **Formulaires** : React Hook Form + Zod pour la validation
- **Erreurs Supabase** : TOUJOURS `catch` + toast Sonner + `console.error`
- Après toute mutation (create/update/delete) : `router.refresh()` ou revalidation
- Images : `next/image` avec `width`/`height` ou `fill` + `sizes`
- Liens : `next/link` — pas de `<a>` brut pour la navigation interne

---

## 8. UX mobile — règles critiques

- **Toasts** : `position="top-center"` — **jamais en bas**
- **Panier** : bouton flottant fixe `bottom-right` sur mobile
- **Barre commande** : `fixed bottom-0` pleine largeur avec total + CTA "Passer commande"
- **Padding bas** : `pb-24` minimum sur le contenu pour ne pas être masqué par la barre fixe
- **Navigation mobile** : bottom tabs ou burger menu — jamais de sidebar permanente

---

## 9. Pages clés

| Route | Rôle |
|-------|------|
| `/` | Landing SaaS — hero + 2 CTA ("Commencer" → `/register`, "Voir la démo" → `/demo`) |
| `/demo` | Vitrine "Maison Kanpai" — données statiques, panier OK, checkout bloqué |
| `/login` | Connexion |
| `/register` | Inscription |
| `/dashboard` | Tableau de bord boutique unique du user |
| `/dashboard/shops/[shopId]/categories` | CRUD catégories (les URL `/dashboard/categories` etc. redirigent ici) |
| `/dashboard/shops/[shopId]/products` | CRUD produits |
| `/dashboard/shops/[shopId]/bundles` | CRUD formules |
| `/dashboard/shops/[shopId]/orders` | Liste et gestion des commandes |
| `/dashboard/settings` | Paramètres compte / interface marchand |
| `/dashboard/shops/[shopId]/settings` | Configuration vitrine (QR, infos, etc.) |
| `/[slug]` | Vitrine publique Bento |

---

## 10. Variables d'environnement

> **Sécurité** : toutes les clés sont dans `.env.local` (gitignored). Ne jamais les coder en dur dans le repo.

```bash
# .env.local (jamais commité)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side uniquement — jamais exposé côté client
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=                 # server-side uniquement
STRIPE_WEBHOOK_SECRET=             # server-side uniquement
NEXT_PUBLIC_BASE_URL=
```

**`NEXT_PUBLIC_BASE_URL`** : URL publique HTTPS canonique de l’app (ex. `https://app.votredomaine.com`). Sert aussi aux liens absolus côté client (vitrines, QR codes, `metadataBase`, sitemap, admin) via `src/lib/publicAppUrl.ts`. Pour l’auth, elle construit en priorité le lien de confirmation d’inscription (`emailRedirectTo` vers `/api/auth/callback?next=…`). Sans elle, l’URL d’email est dérivée de la requête vers `/api/auth/register` (voir `resolvePublicAppOrigin` dans `src/lib/merchant-bootstrap.ts`). **Ne plus utiliser `NEXT_PUBLIC_APP_URL`** (remplacé par cette variable unique).

Vérifier que `.env.local` est bien dans `.gitignore` avant tout commit.

### Supabase — Auth, redirections et emails « Bento Resto »

À configurer dans le dashboard du projet Supabase :

1. **Authentication → URL configuration**  
   - **Site URL** : URL de production (alignée sur `NEXT_PUBLIC_BASE_URL` si vous l’utilisez).  
   - **Redirect URLs** : inclure `https://<votre-domaine>/api/auth/callback` ; ajouter aussi la variante avec paramètres si la console l’exige (ex. `…/api/auth/callback?next=%2Fonboarding%2Fshop`).

2. **Authentication → Email templates**  
   - Modèle **Confirm signup** : sujet et texte au nom de **Bento Resto**, expliquer que le lien active le compte et ouvre l’app (éviter le vocabulaire « Supabase » côté utilisateur).  
   - Adapter au besoin **Magic link** / **Reset password** pour la même cohérence de marque.

3. **SMTP personnalisé** (optionnel)  
   - Permet un expéditeur du type `Bento Resto <no-reply@votredomaine.com>` et réduit l’apparence « message système » générique.

---

## 11. Commandes utiles

```bash
npm run dev          # Serveur local
npm run build        # Build production — doit passer sans erreur avant tout PR
npm run lint         # Lint ESLint

# Régénérer les types Supabase
npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts

# Ajouter un composant shadcn (ne jamais éditer src/components/ui/ manuellement)
npx shadcn@latest add <composant>
```

---

## 12. Ce qu'il ne faut JAMAIS faire

- Exposer `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` côté client
- Bypasser les RLS policies Supabase
- Utiliser `any` sans commentaire justificatif
- Mettre les toasts Sonner en bas (`position="bottom-*"`)
- Permettre la création d'une 2e boutique par user
- Modifier manuellement les fichiers dans `src/components/ui/`
- Faire un fetch Supabase sans gestion d'erreur
- Déployer si `npm run build` échoue
- Coder des clés API en dur dans le code source
