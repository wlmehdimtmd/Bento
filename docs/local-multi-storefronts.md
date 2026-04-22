# Local Multi-Storefront Bento Seed

This dataset creates six local storefronts, each with a dedicated local owner account and a complete Bento catalog.

## Coverage

- 6 shops / 6 audiences.
- 8 categories per shop.
- 8 products per category.
- 3 bundles per shop with category-driven slots.
- Shop labels and storefront theme keys.
- FR/EN localized catalog content (`name_fr`, `name_en`, `description_fr`, `description_en`).

## Audience Matrix

| Shop key | Audience | Positioning | Theme key |
|---|---|---|---|
| `sushi-premium` | Urban premium professionals | Refined Japanese fast-casual | `blue` |
| `boulangerie-quartier` | Local families | Neighborhood bakery convenience | `amber` |
| `coffee-remote` | Students and remote workers | Work-friendly coffee and brunch | `turquoise` |
| `foodtruck-event` | Festival and event crowds | High-throughput street service | `rose` |
| `traiteur-b2b` | Office managers and buyers | Corporate platter logistics | `neutral` |
| `healthy-sport` | Wellness and sport users | Goal-based nutrition menu | `emerald` |

## Data Schema

The blueprint file is versioned in:

- `scripts/data/localMultiStorefrontBlueprints.mjs`

Each shop blueprint contains:

- `owner`: local email, password, display name.
- `shop`: names/descriptions FR/EN, type, slug, fulfillment modes, theme key.
- `labels[]`: per-shop labels (`value`, color, FR/EN labels).
- `categories[]`: 8 categories with FR/EN naming and visual metadata.
- `categories[].products[]`: generated product list with bilingual fields and tags.
- `bundles[]`: pricing + slot composition.
- `bundles[].slots[]`: category references by `category_key`.

## Seed Flow

Script:

- `scripts/seed-local-multi-storefronts.mjs`

Execution behavior:

1. Ensures each auth user exists (`@bento.local`).
2. Upserts corresponding `public.users` row with role `shop_owner`.
3. Ensures one shop per owner and updates storefront metadata.
4. Clears catalog tables for that shop.
5. Inserts labels, categories, products, bundles, and bundle slots.

Idempotency:

- Running the script multiple times updates owner/shop metadata and replaces each shop catalog.

Reset mode:

- `--reset` additionally deletes `orders` and `order_items` for seeded shops.

## Commands

Run standard seed:

`npm run seed:local:multi-storefronts`

Run with reset:

`npm run seed:local:multi-storefronts -- --reset`

## Adaptation QA Checklist

Validate all six storefronts with this matrix:

| Dimension | Check |
|---|---|
| Mobile | Category ordering is clear, CTA and cart remain reachable |
| Tablet | Grid and bento density remain legible |
| Desktop | Catalog scanability and category hierarchy remain clear |
| Light mode | Contrast and card readability pass visual checks |
| Dark mode | Contrast, borders, and overlays remain legible |
| FR locale | All seeded catalog content appears in French |
| EN locale | All seeded catalog content appears in English |
| Audience fit | Category and bundle priorities match intended audience behavior |
| Checkout flow | Cart to checkout demo path remains functional per shop |

