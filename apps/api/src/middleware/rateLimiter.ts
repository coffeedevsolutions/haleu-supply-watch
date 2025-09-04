import { Context, Next } from 'hono';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// Simple in-memory rate limiter (not suitable for production scale, but OK for MVP)
const buckets = new Map<string, TokenBucket>();

export function createRateLimiter(tokensPerMinute: number) {
  return async function rateLimiter(c: Context, next: Next) {
    const ip = c.req.header('CF-Connecting-IP') || 
               c.req.header('X-Forwarded-For') || 
               'unknown';
    
    const now = Date.now();
    const bucket = buckets.get(ip) || { tokens: tokensPerMinute, lastRefill: now };
    
    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / (60 * 1000)) * tokensPerMinute;
    bucket.tokens = Math.min(tokensPerMinute, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    if (bucket.tokens < 1) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    bucket.tokens--;
    buckets.set(ip, bucket);
    
    // Clean up old buckets periodically
    if (Math.random() < 0.01) { // 1% chance
      const cutoff = now - 5 * 60 * 1000; // 5 minutes
      for (const [key, value] of buckets.entries()) {
        if (value.lastRefill < cutoff) {
          buckets.delete(key);
        }
      }
    }
    
    await next();
  };
}
