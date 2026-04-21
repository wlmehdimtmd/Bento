import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Catégories" };

export default async function LegacyCategoriesRedirect() {
  await redirectLegacyDashboardToShopPath("categories");
}
