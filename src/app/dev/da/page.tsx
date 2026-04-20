import { notFound } from "next/navigation";

import { DevDaClient } from "./DevDaClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] DA — Bento Resto" };

export default function DevDaPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DevDaClient />;
}
