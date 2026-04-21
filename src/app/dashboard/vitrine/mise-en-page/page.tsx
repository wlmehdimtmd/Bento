import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Mise en page vitrine" };

export default async function LegacyVitrineLayoutRedirect() {
  await redirectLegacyDashboardToShopPath("vitrine/mise-en-page");
}
