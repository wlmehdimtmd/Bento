import { redirect } from "next/navigation";

type Params = Promise<{ shopId: string }>;

export default async function LegacyShopBentoRedirect({ params }: { params: Params }) {
  const { shopId } = await params;
  redirect(`/dashboard/shops/${shopId}/vitrine/mise-en-page`);
}
