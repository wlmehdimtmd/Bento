import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Commandes" };

export default async function LegacyOrdersRedirect() {
  await redirectLegacyDashboardToShopPath("orders");
}
