/**
 * Rate Limiter — Supabase-backed sliding window (20 req/hour)
 * Uses ai_rate_limits table from migration 011.
 */

import { createClient } from '@/lib/supabase/server';

const REQUESTS_PER_HOUR = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: Date;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createClient();
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const reset = new Date(Date.now() + WINDOW_MS);

  // Count requests in the last hour
  const { count, error } = await supabase
    .from('ai_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart);

  if (error) {
    // Fail open — allow request if we can't check
    console.error('Rate limit check error:', error);
    return { success: true, remaining: REQUESTS_PER_HOUR, reset };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, REQUESTS_PER_HOUR - used);
  const success = used < REQUESTS_PER_HOUR;

  if (success) {
    // Record this request
    await supabase
      .from('ai_rate_limits')
      .insert({ user_id: userId });
  }

  return { success, remaining, reset };
}
