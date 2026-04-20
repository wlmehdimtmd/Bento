import { notFound } from "next/navigation";

import DashboardPage from "@/app/dashboard/page";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] Dashboard — Bento Resto" };

export default async function DevDashboardPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DashboardPage />;
}
