import { redirectLegacyDashboardToShopPath } from "@/lib/dashboard/redirectLegacyDashboardToShopPath";

export const metadata = { title: "Labels" };

export default async function LegacyLabelsRedirect() {
  await redirectLegacyDashboardToShopPath("labels");
}
