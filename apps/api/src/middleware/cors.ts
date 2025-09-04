import { Context, Next } from 'hono';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://haleu-supply-watch.pages.dev', // Replace with your actual Pages domain
  /\.pages\.dev$/ // Allow any pages.dev subdomain
];

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    );
    
    if (!isAllowed) {
      return c.json({ error: 'Origin not allowed' }, 403);
    }
    
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
    c.header('Access-Control-Max-Age', '86400');
  }
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
}
