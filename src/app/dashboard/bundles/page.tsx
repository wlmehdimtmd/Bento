import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Formules" };

export default async function LegacyBundlesRedirect() {
  await redirectLegacyDashboardToShopPath("bundles");
}
