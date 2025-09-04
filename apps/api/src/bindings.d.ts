export type Env = {
  DB: D1Database;
  R2: R2Bucket;
  API_RATE_LIMIT_PER_MIN: string;
  WEBHOOK_ALLOCATIONS_URL?: string;
  WEBHOOK_ALLOCATIONS_SECRET?: string;
};
