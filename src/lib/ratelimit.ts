import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function hasValidUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return false;

  try {
    // Reject malformed values (e.g. "/pipeline") that crash at runtime.
    // URL constructor only accepts absolute URLs here.
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const authRatelimit = hasValidUpstashConfig()
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "auth",
    })
  : null;
