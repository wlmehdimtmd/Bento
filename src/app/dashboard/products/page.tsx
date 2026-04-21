import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Produits" };

export default async function LegacyProductsRedirect() {
  await redirectLegacyDashboardToShopPath("products");
}
