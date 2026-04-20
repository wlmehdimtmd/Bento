import { redirect } from "next/navigation";

export default function LegacyBentoRedirect() {
  redirect("/dashboard/vitrine/mise-en-page");
}
