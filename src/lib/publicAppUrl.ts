/** URL publique du site (vitrines, QR codes, liens partageables). */
export const publicAppUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://bentorest.app"
).replace(/\/$/, "");

export const storefrontPublicUrl = (shopSlug: string): string =>
  `${publicAppUrl}/${shopSlug}`;
