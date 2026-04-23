import { notFound } from "next/navigation";
import { DevCookiesClient } from "./DevCookiesClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "[Dev] Cookies — Bento Resto" };

export default function DevCookiesPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DevCookiesClient />;
}
