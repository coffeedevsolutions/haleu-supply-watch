import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const source = sqliteTable("source", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  type: text("type").notNull(), // regulator|vendor|press
});

export const document = sqliteTable("document", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
  sha256: text("sha256").notNull().unique(),
  url: text("url").notNull(),
  r2key: text("r2_key").notNull(),
  contentType: text("content_type"),
  status: text("status").notNull() // parsed|failed|pending
});

export const allocation = sqliteTable("allocation", {
  id: text("id").primaryKey(),
  allocatedTo: text("allocated_to").notNull(),
  kg: real("kg").notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull(), // conditional|confirmed
  sourceDocId: text("source_doc_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
});

export const deliveryBatch = sqliteTable("delivery_batch", {
  id: text("id").primaryKey(),
  producer: text("producer").notNull(),
  kg: real("kg").notNull(),
  month: text("month").notNull(), // YYYY-MM
  status: text("status").notNull(), // planned|shipped|received
  proofUrl: text("proof_url"),
  sourceDocId: text("source_doc_id")
});

export const updateEvent = sqliteTable("update_event", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changeJson: text("change_json").notNull(),
  actor: text("actor").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull()
});
