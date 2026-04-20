import { notFound } from "next/navigation";

import { DevUiClient } from "./DevUiClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] UI — Bento Resto" };

export default function DevUiPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DevUiClient />;
}
