/** IP / User-Agent pour journaux auth (login, register, etc.). */
export function getAuthRequestMeta(request: Request): {
  ip?: string;
  userAgent?: string;
} {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}
