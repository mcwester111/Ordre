import { createClient } from "@supabase/supabase-js";

// Bare client — no cookie handling needed for server-side rate limiting.
// Uses the anon key; the check_rate_limit function is security definer so
// it can write to rate_limits regardless of RLS.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number };

/**
 * Check and increment the rate limit for a given key.
 * Falls back to allowing the request if Supabase is unreachable.
 */
export async function rateLimitSupabase(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_ms: windowMs,
    });

    if (error) {
      console.error("Rate limit check failed:", error.message);
      return { ok: true }; // fail open — don't block legitimate traffic on DB errors
    }

    if (!data) {
      return { ok: false, retryAfter: Math.ceil(windowMs / 1000) };
    }

    return { ok: true };
  } catch (err) {
    console.error("Rate limit exception:", err);
    return { ok: true }; // fail open
  }
}
