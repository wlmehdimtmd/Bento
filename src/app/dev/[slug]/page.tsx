import { notFound } from "next/navigation";

import ShopPage from "@/app/(public)/[slug]/page";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ order?: string; id?: string }>;

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] Boutique — Bento Resto" };

export default async function DevShopPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <ShopPage params={params} searchParams={searchParams} />;
}
