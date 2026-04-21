/**
 * URL publique canonique du site (vitrines, QR codes, metadata, sitemap).
 * Une seule variable : `NEXT_PUBLIC_BASE_URL` (voir `.env.example` et CLAUDE.md).
 */
export const publicAppUrl = (
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://bentorest.app"
).replace(/\/$/, "");

export const storefrontPublicUrl = (shopSlug: string): string =>
  `${publicAppUrl}/${shopSlug}`;
