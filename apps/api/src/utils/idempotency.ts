// Simple in-memory idempotency tracker for MVP
// In production, this should use Durable Objects or KV store

interface IdempotencyRecord {
  response: any;
  timestamp: number;
}

const idempotencyCache = new Map<string, IdempotencyRecord>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function checkIdempotency(key: string): any | null {
  const record = idempotencyCache.get(key);
  if (!record) return null;
  
  // Clean up expired records
  if (Date.now() - record.timestamp > CACHE_TTL) {
    idempotencyCache.delete(key);
    return null;
  }
  
  return record.response;
}

export function setIdempotency(key: string, response: any): void {
  idempotencyCache.set(key, {
    response,
    timestamp: Date.now()
  });
  
  // Periodic cleanup (1% chance on each call)
  if (Math.random() < 0.01) {
    const now = Date.now();
    for (const [k, v] of idempotencyCache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        idempotencyCache.delete(k);
      }
    }
  }
}
