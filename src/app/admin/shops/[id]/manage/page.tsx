import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

export default async function ManagePage({ params }: { params: Params }) {
  const { id } = await params;
  redirect(`/admin/shops/${id}/manage/categories`);
}
