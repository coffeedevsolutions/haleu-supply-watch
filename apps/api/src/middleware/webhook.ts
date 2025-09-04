import { Context, Next } from "hono";
import { Env } from "../bindings";
import { logError } from "../utils/logging";

export function createWebhookAuth() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    try {
      const secret = c.env.WEBHOOK_ALLOCATIONS_SECRET;
      
      // Allow development without secret
      if (!secret) {
        if (c.env.PUBLIC_BASE_URL?.includes('localhost') || 
            c.env.PUBLIC_BASE_URL?.includes('127.0.0.1')) {
          return await next();
        }
        logError("Webhook secret not configured", new Error("Missing WEBHOOK_ALLOCATIONS_SECRET"));
        return c.json({ error: "Authentication required" }, 401);
      }
      
      const providedSecret = c.req.header("X-Webhook-Secret");
      
      if (!providedSecret) {
        return c.json({ error: "Missing X-Webhook-Secret header" }, 401);
      }
      
      if (providedSecret !== secret) {
        logError("Invalid webhook secret", new Error("Webhook authentication failed"), {
          path: c.req.path,
          provided: providedSecret?.slice(0, 8) + "..."
        });
        return c.json({ error: "Invalid webhook secret" }, 401);
      }
      
      return await next();
    } catch (error) {
      logError("Webhook authentication error", error as Error);
      return c.json({ error: "Authentication failed" }, 500);
    }
  };
}
