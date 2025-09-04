import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const source = sqliteTable("source", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // regulator|vendor|press
  createdAt: integer("created_at").default(sql`unixepoch()`).notNull()
});

export const document = sqliteTable("document", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => source.id),
  title: text("title"),
  url: text("url").notNull(),
  publishedAt: integer("published_at"),
  fetchedAt: integer("fetched_at").notNull(),
  sha256: text("sha256").notNull()
});

export const allocation = sqliteTable("allocation", {
  id: text("id").primaryKey(),
  allocatedTo: text("allocated_to").notNull(),
  kg: real("kg").notNull(),
  status: text("status").notNull(), // conditional|confirmed
  allocationDate: integer("allocation_date"),
  deliveryWindowStart: integer("delivery_window_start"),
  deliveryWindowEnd: integer("delivery_window_end"),
  notes: text("notes"),
  updatedAt: integer("updated_at").notNull(),
  sourceDocId: text("source_doc_id").references(() => document.id)
});

export const deliveryBatch = sqliteTable("delivery_batch", {
  id: text("id").primaryKey(),
  allocationId: text("allocation_id").notNull().references(() => allocation.id),
  kg: real("kg").notNull(),
  status: text("status").notNull(), // planned|shipped|received
  shippedAt: integer("shipped_at"),
  receivedAt: integer("received_at"),
  notes: text("notes"),
  updatedAt: integer("updated_at").notNull()
});

export const updateEvent = sqliteTable("update_event", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changeJson: text("change_json").notNull(),
  actor: text("actor").notNull(),
  occurredAt: integer("occurred_at").notNull()
});
