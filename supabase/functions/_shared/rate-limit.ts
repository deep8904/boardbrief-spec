import { getServiceClient } from './auth.ts';

const RATE_LIMIT_DEFAULT_PER_10_MIN = 30;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = RATE_LIMIT_DEFAULT_PER_10_MIN
): Promise<RateLimitResult> {
  const supabase = getServiceClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  // Get current request count in window
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const newCount = existing.request_count + 1;
    
    if (newCount > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(new Date(existing.window_start).getTime() + WINDOW_MS),
      };
    }

    // Update count
    await supabase
      .from('rate_limits')
      .update({ request_count: newCount })
      .eq('id', existing.id);

    return {
      allowed: true,
      remaining: limit - newCount,
      resetAt: new Date(new Date(existing.window_start).getTime() + WINDOW_MS),
    };
  }

  // Create new window
  await supabase.from('rate_limits').insert({
    user_id: userId,
    endpoint,
    request_count: 1,
    window_start: now.toISOString(),
  });

  return {
    allowed: true,
    remaining: limit - 1,
    resetAt: new Date(now.getTime() + WINDOW_MS),
  };
}
