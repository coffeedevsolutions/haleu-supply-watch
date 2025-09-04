import { Hono } from "hono";
import { Env } from "./bindings";
import { 
  AllocationsBulkUpsertSchema, 
  DeliveryBatchesBulkUpsertSchema,
  AllocationsQuerySchema,
  ChangesQuerySchema,
  type Allocation,
  type DeliveryBatch,
  type UpdateEvent,
  type ApiResponse
} from "@hsw/shared";
import { corsMiddleware } from "./middleware/cors";
import { createRateLimiter } from "./middleware/rateLimiter";
import { createWebhookAuth } from "./middleware/webhook";
import { checkIdempotency, setIdempotency } from "./utils/idempotency";
import { log, logError, logRequest } from "./utils/logging";
import { runDoeAllocations } from "./ingest/doeAllocations";
import { runDOEHubIngest } from "./ingest/energyGovHub";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", corsMiddleware);

// Error handler
app.onError((err, c) => {
  logError("Unhandled error", err, { path: c.req.path, method: c.req.method });
  return c.json({ error: "Internal server error" }, 500);
});

// Rate limiter for public endpoints
const rateLimiter = createRateLimiter(60); // Default from env

// Webhook authentication for internal endpoints
const webhookAuth = createWebhookAuth();

// Health endpoint
app.get("/v1/health", (c) => {
  return c.json({ ok: true });
});

// Public API endpoints with rate limiting
app.get("/v1/allocations", rateLimiter, async (c) => {
  const start = Date.now();
  
  try {
    const query = AllocationsQuerySchema.parse({
      status: c.req.query("status"),
      since: c.req.query("since"),
      limit: c.req.query("limit") || "50",
      cursor: c.req.query("cursor")
    });

    let sql = `
      SELECT id, allocated_to, kg, status, allocation_date, 
             delivery_window_start, delivery_window_end, notes, updated_at
      FROM allocation
    `;
    const params: any[] = [];

    // Build WHERE clauses
    const conditions: string[] = [];
    if (query.status) {
      conditions.push("status = ?");
      params.push(query.status);
    }
    if (query.since) {
      // Try to parse as unix timestamp first, then ISO date
      const sinceTimestamp = /^\d+$/.test(query.since) 
        ? parseInt(query.since) 
        : Math.floor(new Date(query.since).getTime() / 1000);
      conditions.push("updated_at >= ?");
      params.push(sinceTimestamp);
    }
    if (query.cursor) {
      conditions.push("updated_at <= ?");
      params.push(parseInt(query.cursor));
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += ` ORDER BY updated_at DESC LIMIT ${query.limit + 1}`;

    const result = await c.env.DB.prepare(sql).bind(...params).all();
    const items = (result.results as unknown as Allocation[]) || [];
    
    // Determine if there's a next page
    let nextCursor: string | undefined;
    if (items.length > query.limit) {
      const lastItem = items.pop()!;
      nextCursor = lastItem.updatedAt.toString();
    }

    const response: ApiResponse<Allocation> = { items, nextCursor };
    
    logRequest("GET", "/v1/allocations", 200, Date.now() - start);
    return c.json(response);
  } catch (error) {
    logError("Error fetching allocations", error as Error);
    return c.json({ error: "Invalid query parameters" }, 400);
  }
});

app.get("/v1/allocations/:id", rateLimiter, async (c) => {
  const start = Date.now();
  const id = c.req.param("id");

  try {
    // Get the allocation
    const allocationResult = await c.env.DB.prepare(`
      SELECT id, allocated_to, kg, status, allocation_date, 
             delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
      FROM allocation WHERE id = ?
    `).bind(id).first();

    if (!allocationResult) {
      return c.json({ error: "Allocation not found" }, 404);
    }

    // Get recent delivery batches for this allocation
    const deliveriesResult = await c.env.DB.prepare(`
      SELECT id, allocation_id, kg, status, shipped_at, received_at, notes, updated_at
      FROM delivery_batch 
      WHERE allocation_id = ? 
      ORDER BY updated_at DESC
    `).bind(id).all();

    const response = {
      allocation: allocationResult,
      deliveries: deliveriesResult.results || []
    };

    logRequest("GET", `/v1/allocations/${id}`, 200, Date.now() - start);
    return c.json(response);
  } catch (error) {
    logError("Error fetching allocation", error as Error, { allocationId: id });
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/v1/changes", rateLimiter, async (c) => {
  const start = Date.now();

  try {
    const query = ChangesQuerySchema.parse({
      limit: c.req.query("limit") || "50",
      cursor: c.req.query("cursor")
    });

    let sql = `
      SELECT id, entity_type, entity_id, change_json, actor, occurred_at
      FROM update_event
    `;
    const params: any[] = [];

    if (query.cursor) {
      sql += " WHERE occurred_at <= ?";
      params.push(parseInt(query.cursor));
    }

    sql += ` ORDER BY occurred_at DESC LIMIT ${query.limit + 1}`;

    const result = await c.env.DB.prepare(sql).bind(...params).all();
    const items = (result.results as unknown as UpdateEvent[]) || [];

    // Determine if there's a next page
    let nextCursor: string | undefined;
    if (items.length > query.limit) {
      const lastItem = items.pop()!;
      nextCursor = lastItem.occurredAt.toString();
    }

    const response: ApiResponse<UpdateEvent> = { items, nextCursor };
    
    logRequest("GET", "/v1/changes", 200, Date.now() - start);
    return c.json(response);
  } catch (error) {
    logError("Error fetching changes", error as Error);
    return c.json({ error: "Invalid query parameters" }, 400);
  }
});

app.get("/v1/sources", rateLimiter, async (c) => {
  const start = Date.now();

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, name, url FROM source ORDER BY name
    `).all();

    logRequest("GET", "/v1/sources", 200, Date.now() - start);
    return c.json({ items: result.results || [] });
  } catch (error) {
    logError("Error fetching sources", error as Error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/v1/documents/:id", rateLimiter, async (c) => {
  const start = Date.now();
  const id = c.req.param("id");

  try {
    const result = await c.env.DB.prepare(`
      SELECT id, source_id, title, url, published_at, fetched_at, sha256
      FROM document WHERE id = ?
    `).bind(id).first();

    if (!result) {
      return c.json({ error: "Document not found" }, 404);
    }

    logRequest("GET", `/v1/documents/${id}`, 200, Date.now() - start);
    return c.json(result);
  } catch (error) {
    logError("Error fetching document", error as Error, { documentId: id });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Internal import endpoints (webhook auth, no rate limiting)
app.post("/internal/import/allocations", webhookAuth, async (c) => {
  const start = Date.now();

  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        log("info", "Idempotent request served from cache", { key: idempotencyKey });
        return c.json(cached);
      }
    }

    const body = await c.req.json();
    const parsed = AllocationsBulkUpsertSchema.parse(body);
    
    // Handle both single object and bulk array
    const items = Array.isArray(parsed) ? parsed : 
                  'items' in parsed ? parsed.items : [parsed];

    let upsertCount = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const item of items) {
      const result = await c.env.DB.prepare(`
        INSERT INTO allocation (
          id, allocated_to, kg, status, allocation_date, 
          delivery_window_start, delivery_window_end, notes, updated_at, source_doc_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          allocated_to=excluded.allocated_to,
          kg=excluded.kg,
          status=excluded.status,
          allocation_date=excluded.allocation_date,
          delivery_window_start=excluded.delivery_window_start,
          delivery_window_end=excluded.delivery_window_end,
          notes=excluded.notes,
          updated_at=excluded.updated_at,
          source_doc_id=excluded.source_doc_id
      `).bind(
        item.id,
        item.allocated_to,
        item.kg,
        item.status,
        item.allocation_date ?? null,
        item.delivery_window_start ?? null,
        item.delivery_window_end ?? null,
        item.notes ?? null,
        now,
        item.source_doc_id ?? null
      ).run();

      if (result.meta?.changes && result.meta.changes > 0) {
        upsertCount++;
      }
    }

    // Create update event
    if (items.length > 0) {
      const eventId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        "allocation",
        "bulk",
        JSON.stringify({ upserted: upsertCount, total: items.length }),
        "internal/import",
        now
      ).run();
    }

    const response = { ok: true, upserted: upsertCount, total: items.length };

    if (idempotencyKey) {
      setIdempotency(idempotencyKey, response);
    }

    logRequest("POST", "/internal/import/allocations", 200, Date.now() - start);
    log("info", "Allocations imported", { upserted: upsertCount, total: items.length });
    
    return c.json(response);
  } catch (error) {
    logError("Error importing allocations", error as Error);
    if (error instanceof Error && error.message.includes("parse")) {
      return c.json({ error: "Invalid request body", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/internal/import/deliveries", webhookAuth, async (c) => {
  const start = Date.now();

  try {
    const idempotencyKey = c.req.header("Idempotency-Key");
    if (idempotencyKey) {
      const cached = checkIdempotency(idempotencyKey);
      if (cached) {
        return c.json(cached);
      }
    }

    const body = await c.req.json();
    const parsed = DeliveryBatchesBulkUpsertSchema.parse(body);
    
    const items = Array.isArray(parsed) ? parsed : 
                  'items' in parsed ? parsed.items : [parsed];

    let upsertCount = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const item of items) {
      const result = await c.env.DB.prepare(`
        INSERT INTO delivery_batch (
          id, allocation_id, kg, status, shipped_at, received_at, notes, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          allocation_id=excluded.allocation_id,
          kg=excluded.kg,
          status=excluded.status,
          shipped_at=excluded.shipped_at,
          received_at=excluded.received_at,
          notes=excluded.notes,
          updated_at=excluded.updated_at
      `).bind(
        item.id,
        item.allocation_id,
        item.kg,
        item.status,
        item.shipped_at ?? null,
        item.received_at ?? null,
        item.notes ?? null,
        now
      ).run();

      if (result.meta?.changes && result.meta.changes > 0) {
        upsertCount++;
      }
    }

    if (items.length > 0) {
      const eventId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO update_event (id, entity_type, entity_id, change_json, actor, occurred_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        "delivery_batch",
        "bulk",
        JSON.stringify({ upserted: upsertCount, total: items.length }),
        "internal/import",
        now
      ).run();
    }

    const response = { ok: true, upserted: upsertCount, total: items.length };

    if (idempotencyKey) {
      setIdempotency(idempotencyKey, response);
    }

    logRequest("POST", "/internal/import/deliveries", 200, Date.now() - start);
    return c.json(response);
  } catch (error) {
    logError("Error importing deliveries", error as Error);
    if (error instanceof Error && error.message.includes("parse")) {
      return c.json({ error: "Invalid request body", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Manual ingest trigger
app.post("/internal/ingest/doe", webhookAuth, async (c) => {
  const start = Date.now();

  try {
    log("info", "Manual DOE ingest triggered");
    await runDoeAllocations(c.env);
    
    logRequest("POST", "/internal/ingest/doe", 200, Date.now() - start);
    return c.json({ ok: true, message: "DOE allocations ingest completed" });
  } catch (error) {
    logError("Error in manual DOE ingest", error as Error);
    return c.json({ error: "Ingest failed" }, 500);
  }
});

// Export default with scheduled handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env) {
    log("info", "Scheduled ingest triggered", { cron: event.cron });
    try {
      // Run both fixture-based and live DOE hub ingests
      await Promise.allSettled([
        runDoeAllocations(env),
        runDOEHubIngest(env)
      ]).then(results => {
        const [fixtureResult, hubResult] = results;
        
        if (fixtureResult.status === 'fulfilled') {
          log("info", "Fixture ingest completed successfully");
        } else {
          logError("Fixture ingest failed", fixtureResult.reason);
        }
        
        if (hubResult.status === 'fulfilled') {
          log("info", "DOE hub ingest completed successfully");
        } else {
          logError("DOE hub ingest failed", hubResult.reason);
        }
      });
      
      log("info", "All scheduled ingests completed");
    } catch (error) {
      logError("Scheduled ingest failed", error as Error);
    }
  }
};
