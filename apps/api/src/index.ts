import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./bindings";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { z } from "zod";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/v1/health", (c) => c.json({ ok: true }));

app.get("/v1/allocations", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  // very simple list with optional ?status=confirmed
  const status = c.req.query("status");
  const rows = await c.env.DB.prepare(
    `SELECT id, allocated_to, kg, start_date, end_date, status FROM allocation
     ${status ? "WHERE status = ?" : ""} ORDER BY updated_at DESC LIMIT 100`
  ).bind(...(status ? [status] : [])).all();
  return c.json({ items: rows.results ?? [] });
});

// Minimal import endpoint for ETL (idempotent upsert by id)
const AllocationUpsert = z.object({
  id: z.string(),
  allocated_to: z.string(),
  kg: z.number(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.enum(["conditional","confirmed"]),
  source_doc_id: z.string().optional()
});

app.post("/internal/import/allocations", async (c) => {
  const body = await c.req.json();
  const parsed = AllocationUpsert.parse(body);

  await c.env.DB.prepare(`
    INSERT INTO allocation (id, allocated_to, kg, start_date, end_date, status, source_doc_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
    ON CONFLICT(id) DO UPDATE SET
      allocated_to=excluded.allocated_to,
      kg=excluded.kg,
      start_date=excluded.start_date,
      end_date=excluded.end_date,
      status=excluded.status,
      source_doc_id=excluded.source_doc_id,
      updated_at=unixepoch()
  `)
  .bind(parsed.id, parsed.allocated_to, parsed.kg, parsed.start_date ?? null, parsed.end_date ?? null, parsed.status, parsed.source_doc_id ?? null)
  .run();

  return c.json({ ok: true });
});

// Cron stub (hourly) — fetch real sources later
app.get("/__cron", async (c) => c.text("ok"));
export default app;
