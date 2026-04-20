import { createServiceClient } from "@/lib/supabase/server";

export type AuthEventType = "login" | "login_failed" | "register" | "logout";

interface AuthEventMeta {
  ip?: string;
  userAgent?: string;
}

export async function logAuthEvent(
  event: AuthEventType,
  userId: string | null,
  meta: AuthEventMeta = {}
): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("auth_events").insert({
      event,
      user_id: userId ?? null,
      ip: meta.ip ?? null,
      user_agent: meta.userAgent ?? null,
    });
  } catch (err) {
    // Ne jamais bloquer le flux auth sur une erreur de logging
    console.error("[auth-logger] Failed to log event", event, err);
  }
}
