import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface AuthGuardProps {
  children: (user: { id: string; email: string }) => React.ReactNode;
}

export async function AuthGuard({ children }: AuthGuardProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children({ id: user.id, email: user.email ?? "" })}</>;
}
