import { z } from 'zod';

// Base schemas for validation
export const AllocationUpsertSchema = z.object({
  id: z.string().min(1),
  allocated_to: z.string().min(1),
  kg: z.number().positive(),
  status: z.enum(['conditional', 'confirmed']),
  allocation_date: z.number().int().optional(),
  delivery_window_start: z.number().int().optional(),
  delivery_window_end: z.number().int().optional(),
  notes: z.string().optional(),
  source_doc_id: z.string().optional()
});

export const DeliveryBatchUpsertSchema = z.object({
  id: z.string().min(1),
  allocation_id: z.string().min(1),
  kg: z.number().positive(),
  status: z.enum(['planned', 'shipped', 'received']),
  shipped_at: z.number().int().optional(),
  received_at: z.number().int().optional(),
  notes: z.string().optional()
});

// Bulk import schemas
export const AllocationsBulkUpsertSchema = z.union([
  AllocationUpsertSchema,
  z.object({
    items: z.array(AllocationUpsertSchema)
  })
]);

export const DeliveryBatchesBulkUpsertSchema = z.union([
  DeliveryBatchUpsertSchema,
  z.object({
    items: z.array(DeliveryBatchUpsertSchema)
  })
]);

// Query parameter schemas
export const AllocationsQuerySchema = z.object({
  status: z.enum(['conditional', 'confirmed']).optional(),
  since: z.string().optional(), // unix timestamp or ISO date
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('50'),
  cursor: z.string().optional()
});

export const ChangesQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('50'),
  cursor: z.string().optional()
});

// Types inferred from schemas
export type AllocationUpsert = z.infer<typeof AllocationUpsertSchema>;
export type DeliveryBatchUpsert = z.infer<typeof DeliveryBatchUpsertSchema>;
export type AllocationsBulkUpsert = z.infer<typeof AllocationsBulkUpsertSchema>;
export type DeliveryBatchesBulkUpsert = z.infer<typeof DeliveryBatchesBulkUpsertSchema>;
export type AllocationsQuery = z.infer<typeof AllocationsQuerySchema>;
export type ChangesQuery = z.infer<typeof ChangesQuerySchema>;
