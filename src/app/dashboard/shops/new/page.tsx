import { redirect } from "next/navigation";

/** La création de boutique est réservée à l’administration. */
export default function NewShopPage() {
  redirect("/dashboard");
}
