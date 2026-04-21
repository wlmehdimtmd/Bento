import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export default async function LegacyBentoRedirect() {
  await redirectLegacyDashboardToShopPath("vitrine/mise-en-page");
}
